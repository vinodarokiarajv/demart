const Stripe = require("stripe");

const config = require("../config");
const pool = require("../db/db");
const paymentRepository = require("../repositories/paymentRepository");
const paymentService = require("../services/paymentService");
const orderRepository = require("../repositories/orderRepository");

const stripe = new Stripe(config.stripe.secretKey);
const PAYMENT_PROVIDER = "STRIPE";

async function handleStripeWebhook(req, res) {
    if (!config.stripe.webhookSecret) {
        return res.status(503).json({
            message: "Stripe webhook secret is not configured"
        });
    }

    const signature = req.headers["stripe-signature"];

    if (!signature) {
        return res.status(400).json({
            message: "Missing Stripe signature"
        });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            config.stripe.webhookSecret
        );
    } catch (error) {
        console.error(
            "Stripe webhook signature verification failed:",
            error.message
        );

        return res.status(400).json({
            message: "Invalid Stripe webhook signature"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        let webhookEvent =
            await paymentRepository.createWebhookEvent(
                client,
                PAYMENT_PROVIDER,
                event.id,
                event.type
            );

        if (!webhookEvent) {
            webhookEvent =
                await paymentRepository.findWebhookEvent(
                    client,
                    PAYMENT_PROVIDER,
                    event.id,
                    true
                );

            if (
                webhookEvent &&
                webhookEvent.processed_at
            ) {
                await client.query("COMMIT");

                return res.status(200).json({
                    received: true,
                    duplicate: true
                });
            }
        }

        if (!webhookEvent) {
            throw new Error(
                "Unable to record Stripe webhook event"
            );
        }

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;

                const paymentId =
                    session.metadata &&
                    session.metadata.paymentId;

                if (!paymentId) {
                    throw new Error(
                        "Stripe Checkout Session is missing payment ID metadata"
                    );
                }

                if (!session.payment_intent) {
                    throw new Error(
                        "Stripe Checkout Session is missing payment intent"
                    );
                }

                const amountReceived =
                    Number(session.amount_total) / 100;

                const currency =
                    String(session.currency || "").toUpperCase();

                await paymentService.completeStripePayment({
                    paymentId,
                    paymentIntentId: session.payment_intent,
                    amount: amountReceived,
                    currency,
                    client
                });

                break;
            }

            case "payment_intent.payment_failed": {
    const paymentIntent = event.data.object;

    const payment =
        await paymentRepository.findPaymentByPaymentIntentId(
            PAYMENT_PROVIDER,
            paymentIntent.id
        );

    if (!payment) {
        /*
         * A failed PaymentIntent may occur before our database
         * has recorded the PaymentIntent ID. Do not fail the
         * entire webhook transaction for an event that cannot
         * currently be correlated.
         */
        console.warn(
            `No payment found for failed Stripe payment intent ${paymentIntent.id}`
        );
        break;
    }

    /*
     * A failed payment attempt does not necessarily mean that
     * the Checkout Session has failed permanently. The customer
     * may retry payment within the same Checkout Session.
     *
     * Therefore we record the failure details but keep the
     * payment/order pending and keep the inventory reservation.
     */
    const failureCode =
        paymentIntent.last_payment_error &&
        paymentIntent.last_payment_error.code
            ? paymentIntent.last_payment_error.code
            : null;

    const failureMessage =
        paymentIntent.last_payment_error &&
        paymentIntent.last_payment_error.message
            ? paymentIntent.last_payment_error.message
            : null;

    if (payment.provider_payment_intent_id !== paymentIntent.id) {
        await paymentRepository.updateStripePaymentIntent(
            client,
            payment.id,
            paymentIntent.id
        );
    }

    if (failureCode || failureMessage) {
        await paymentRepository.updatePaymentFailureDetails(
            client,
            payment.id,
            failureCode,
            failureMessage
        );
    }

    break;
}

            case "checkout.session.expired": {
                const session = event.data.object;

                const paymentId =
                    session.metadata &&
                    session.metadata.paymentId;

                if (!paymentId) {
                    throw new Error(
                        "Expired Stripe Checkout Session is missing payment ID metadata"
                    );
                }

                await paymentService.failStripePayment({
                    paymentId,
                    status: "CANCELLED",
                    failureCode: "checkout_session_expired",
                    failureMessage:
                        "Stripe Checkout Session expired",
                    client
                });

                break;
            }

            default:
                break;
        }

        const processed =
            await paymentRepository.markWebhookEventProcessed(
                client,
                webhookEvent.id
            );

        if (!processed) {
            throw new Error(
                "Failed to mark Stripe webhook event as processed"
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({
            received: true
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Stripe webhook rollback error:",
                rollbackError
            );
        }

        console.error(
            "Stripe webhook processing error:",
            error
        );

        return res.status(500).json({
            message: "Webhook processing failed"
        });
    } finally {
        client.release();
    }
}

async function cancelCheckout(req, res) {
    try {
        const orderId = Number(req.body.orderId);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order =
            await orderRepository.findOrderByIdAndUserId(
                orderId,
                req.user.id
            );

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (
            !["PENDING", "PROCESSING"].includes(
                order.payment_status
            )
        ) {
            return res.status(409).json({
                message:
                    `Payment cannot be cancelled from status: ${order.payment_status}`,
                paymentStatus: order.payment_status
            });
        }

        const payments =
            await paymentRepository.findPaymentByOrderId(
                orderId
            );

        if (!payments || payments.length === 0) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        const payment = payments[0];

        if (!payment.provider_checkout_session_id) {
            return res.status(409).json({
                message: "Stripe Checkout Session not found"
            });
        }

        const result =
            await paymentService.expireStripeCheckoutSession({
                paymentId: payment.id,
                checkoutSessionId:
                    payment.provider_checkout_session_id
            });

        return res.status(200).json({
            message: result.alreadyCompleted
                ? "Payment is already completed or cancelled"
                : "Stripe Checkout Session expired",
            paymentStatus: result.payment.status,
            checkoutSessionStatus:
                result.checkoutSessionStatus || null,
            alreadyCompleted: result.alreadyCompleted
        });
    } catch (error) {
        console.error("Cancel checkout error:", error);

        return res.status(400).json({
            message: error.message
        });
    }
}

module.exports = {
    handleStripeWebhook,
    cancelCheckout
};