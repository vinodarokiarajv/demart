const Stripe = require("stripe");
const config = require("../config");
const pool = require("../db/db");
const paymentRepository = require("../repositories/paymentRepository");
const orderRepository = require("../repositories/orderRepository");
const inventoryReservationRepository = require(
    "../repositories/inventoryReservationRepository"
);

const stripe = new Stripe(config.stripe.secretKey);

const PAYMENT_PROVIDER = "STRIPE";
const PAYMENT_CURRENCY = "EUR";

async function createCheckoutSession({
    order,
    items,
    customerEmail,
    idempotencyKey
}) {
    if (!order || !order.id) {
        throw new Error("Order is required");
    }

    if (!items || items.length === 0) {
        throw new Error("Order items are required");
    }

    if (!customerEmail) {
        throw new Error("Customer email is required");
    }

    const orderAmount = Number(order.total_amount);

    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
        throw new Error("Invalid order amount");
    }

    const lineItems = items.map((item) => {
        const unitPrice = Number(item.unitPrice);

        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
            throw new Error(
                `Invalid unit price for product ${item.productId}`
            );
        }

        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new Error(
                `Invalid quantity for product ${item.productId}`
            );
        }

        return {
            price_data: {
                currency: PAYMENT_CURRENCY.toLowerCase(),
                product_data: {
                    name:
                        item.productName ||
                        `Product ${item.productId}`
                },
                unit_amount: Math.round(unitPrice * 100)
            },
            quantity: item.quantity
        };
    });

    if (Number(order.shipping_amount) > 0) {
        lineItems.push({
            price_data: {
                currency: PAYMENT_CURRENCY.toLowerCase(),
                product_data: {
                    name:
                        order.delivery_method === "express"
                            ? "Express Shipping"
                            : "Standard Shipping"
                },
                unit_amount: Math.round(
                    Number(order.shipping_amount) * 100
                )
            },
            quantity: 1
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const payment = await paymentRepository.createPayment(
            client,
            {
                orderId: order.id,
                provider: PAYMENT_PROVIDER,
                amount: orderAmount,
                currency: PAYMENT_CURRENCY,
                status: "PENDING",
                idempotencyKey: idempotencyKey || null
            }
        );

        let checkoutSession;

        try {
            checkoutSession = await stripe.checkout.sessions.create(
                {
                    mode: "payment",
                    line_items: lineItems,
                    customer_email: customerEmail,
                    client_reference_id: String(order.id),
                    metadata: {
                        orderId: String(order.id),
                        userId: String(order.user_id),
                        paymentId: String(payment.id)
                    },
                    
                    payment_intent_data: {
                        metadata: {
                            orderId: String(order.id),
                            userId: String(order.user_id),
                            paymentId: String(payment.id)
                        }
                    },
                    success_url:
                        `${config.frontendUrl}/pages/order-confirmation.html` +
                        `?orderId=${order.id}` +
                        `&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url:
                        `${config.frontendUrl}/pages/checkout.html` +
                        `?payment=cancelled` +
                        `&orderId=${order.id}`,
                    payment_method_types: ["card"]
                },
                idempotencyKey
                    ? { idempotencyKey }
                    : undefined
            );
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }

        await paymentRepository.updateStripeCheckoutSession(
            client,
            payment.id,
            checkoutSession.id
        );

        await client.query("COMMIT");

        return {
            paymentId: payment.id,
            checkoutSessionId: checkoutSession.id,
            checkoutUrl: checkoutSession.url
        };
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Payment transaction rollback error:",
                rollbackError
            );
        }

        throw error;
    } finally {
        client.release();
    }
}

async function completeStripePayment({
    paymentId,
    paymentIntentId,
    amount,
    currency = PAYMENT_CURRENCY,
    client: providedClient = null
}) {
    if (!paymentId) {
        throw new Error("Payment ID is required");
    }

    if (!paymentIntentId) {
        throw new Error("Stripe payment intent ID is required");
    }

    const normalizedCurrency = String(currency).toUpperCase();

    const client = providedClient || await pool.connect();
    const ownsTransaction = !providedClient;

    try {
        if (ownsTransaction) {
            await client.query("BEGIN");
        }

        const payment = await paymentRepository.findPaymentById(
            paymentId,
            client
        );

        if (!payment) {
            throw new Error("Payment not found");
        }

        if (payment.provider !== PAYMENT_PROVIDER) {
            throw new Error("Invalid payment provider");
        }

        if (payment.status === "PAID") {
            if (ownsTransaction) {
                await client.query("COMMIT");
            }

            return {
                payment,
                alreadyCompleted: true
            };
        }

        if (!["PENDING", "PROCESSING"].includes(payment.status)) {
            throw new Error(
                `Payment cannot be completed from status: ${payment.status}`
            );
        }

        const paymentAmount = Number(payment.amount);
        const receivedAmount = Number(amount);

        if (
            !Number.isFinite(receivedAmount) ||
            receivedAmount <= 0
        ) {
            throw new Error("Invalid payment amount");
        }

        if (paymentAmount !== receivedAmount) {
            throw new Error("Payment amount mismatch");
        }

        if (payment.currency !== normalizedCurrency) {
            throw new Error("Payment currency mismatch");
        }

        const orderAmount = Number(payment.amount);

        if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
            throw new Error("Invalid stored payment amount");
        }

        const reservations =
            await inventoryReservationRepository.findActiveReservationsByOrderId(
                payment.order_id,
                client
            );

        if (reservations.length === 0) {
            throw new Error(
                "No active inventory reservations found for payment"
            );
        }

        await paymentRepository.updateStripePaymentIntent(
            client,
            payment.id,
            paymentIntentId
        );

        const updatedPayment =
            await paymentRepository.updatePaymentStatus(
                client,
                payment.id,
                "PAID"
            );

        if (!updatedPayment) {
            throw new Error("Failed to update payment status");
        }

        const updatedOrder =
            await orderRepository.updateOrderAndPaymentStatus(
                payment.order_id,
                "CONFIRMED",
                "PAID",
                client
            );

        if (!updatedOrder) {
            throw new Error("Failed to update order payment status");
        }

        const consumedReservations = [];

        for (const reservation of reservations) {
            const consumed =
                await inventoryReservationRepository.consumeReservation(
                    client,
                    reservation.id
                );

            if (!consumed) {
                throw new Error(
                    `Failed to consume inventory reservation ${reservation.id}`
                );
            }

            consumedReservations.push(consumed);
        }

        if (ownsTransaction) {
    await client.query("COMMIT");
}

return {
    payment: updatedPayment,
    order: updatedOrder,
    reservations: consumedReservations,
    alreadyCompleted: false,
    paymentIntentId
};  
    } catch (error) {
        if (ownsTransaction) {
    try {
        await client.query("ROLLBACK");
    } catch (rollbackError) {
        console.error(
            "Payment completion rollback error:",
            rollbackError
        );
    }
}

        throw error;
    } finally {
    if (!providedClient) {
        client.release();
    }
}
}

async function failStripePayment({
    paymentId,
    paymentIntentId = null,
    status = "FAILED",
    failureCode = null,
    failureMessage = null,
    client: providedClient = null
}) {
    if (!paymentId) {
        throw new Error("Payment ID is required");
    }

    const allowedStatuses = ["FAILED", "CANCELLED"];

    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid payment failure status");
    }

    const client = providedClient || await pool.connect();
const ownsTransaction = !providedClient;

try {
    if (ownsTransaction) {
        await client.query("BEGIN");
    }

        const payment = await paymentRepository.findPaymentById(
            paymentId,
            client
        );

        if (!payment) {
            throw new Error("Payment not found");
        }

        if (payment.provider !== PAYMENT_PROVIDER) {
            throw new Error("Invalid payment provider");
        }

        if (payment.status === "PAID") {
            throw new Error(
                "A paid payment cannot be marked as failed or cancelled"
            );
        }

        if (payment.status === status) {
    if (ownsTransaction) {
        await client.query("COMMIT");
    }

    return {
        payment,
        alreadyCompleted: true
    };
}

        if (!["PENDING", "PROCESSING"].includes(payment.status)) {
            throw new Error(
                `Payment cannot be failed from status: ${payment.status}`
            );
        }

        if (paymentIntentId) {
            await paymentRepository.updateStripePaymentIntent(
                client,
                payment.id,
                paymentIntentId
            );
        }

        const activeReservations =
            await inventoryReservationRepository.findActiveReservationsByOrderId(
                payment.order_id,
                client
            );

        const updatedPayment =
            await paymentRepository.updatePaymentStatus(
                client,
                payment.id,
                status,
                failureCode,
                failureMessage
            );

        if (!updatedPayment) {
            throw new Error("Failed to update payment status");
        }

        let updatedOrder;

        if (status === "CANCELLED") {
            updatedOrder =
                await orderRepository.updateOrderAndPaymentStatus(
                    payment.order_id,
                    "CANCELLED",
                    "CANCELLED",
                    client
                );
        } else {
            updatedOrder =
                await orderRepository.updatePaymentStatus(
                    payment.order_id,
                    status,
                    client
                );
        }

        if (!updatedOrder) {
            throw new Error("Failed to update order payment status");
        }

        const releasedReservations = [];

        for (const reservation of activeReservations) {
            const released =
                await inventoryReservationRepository.releaseReservation(
                    client,
                    reservation.id
                );

            if (!released) {
                throw new Error(
                    `Failed to release inventory reservation ${reservation.id}`
                );
            }

            releasedReservations.push(released);
        }

        if (ownsTransaction) {
    await client.query("COMMIT");
}

return {
    payment: updatedPayment,
    order: updatedOrder,
    reservations: releasedReservations,
    alreadyCompleted: false
};
    } catch (error) {
        if (ownsTransaction) {
    try {
        await client.query("ROLLBACK");
    } catch (rollbackError) {
        console.error(
            "Payment failure rollback error:",
            rollbackError
        );
    }
}

        throw error;
    } finally {
    if (!providedClient) {
        client.release();
    }
}
}

async function expireStripeCheckoutSession({
    paymentId,
    checkoutSessionId
}) {
    if (!paymentId) {
        throw new Error("Payment ID is required");
    }

    if (!checkoutSessionId) {
        throw new Error("Stripe Checkout Session ID is required");
    }

    const payment = await paymentRepository.findPaymentById(
        paymentId
    );

    if (!payment) {
        throw new Error("Payment not found");
    }

    if (payment.provider !== PAYMENT_PROVIDER) {
        throw new Error("Invalid payment provider");
    }

    if (
        payment.provider_checkout_session_id !==
        checkoutSessionId
    ) {
        throw new Error("Invalid Stripe Checkout Session");
    }

    if (payment.status === "PAID") {
        throw new Error(
            "A paid payment cannot be cancelled"
        );
    }

    if (!["PENDING", "PROCESSING"].includes(payment.status)) {
        return {
            payment,
            alreadyCompleted: true
        };
    }

    const checkoutSession =
        await stripe.checkout.sessions.expire(
            checkoutSessionId
        );

    return {
        payment,
        checkoutSessionId: checkoutSession.id,
        checkoutSessionStatus: checkoutSession.status,
        alreadyCompleted: false
    };
}

module.exports = {
    createCheckoutSession,
    completeStripePayment,
    failStripePayment,
    expireStripeCheckoutSession
};
