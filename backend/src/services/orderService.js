const pool = require("../db/db");
const AppError = require("../utils/appError");

const orderRepository = require("../repositories/orderRepository");
const productRepository = require("../repositories/productRepository");

const inventoryReservationRepository = require(
    "../repositories/inventoryReservationRepository"
);

const FREE_SHIPPING_THRESHOLD = 100;
const STANDARD_SHIPPING_FEE = 4.99;
const EXPRESS_SHIPPING_FEE = 9.99;

const ALLOWED_DELIVERY_METHODS = [
    "standard",
    "express"
];

const ALLOWED_PAYMENT_METHODS = [
    "card",
    "paypal"
];

async function createOrder(
    userId,
    items,
    shippingAddress,
    deliveryMethod,
    paymentMethod
) {
    if (!userId) {
        throw new AppError("User ID is required", 400);
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new AppError("Order must contain at least one item", 400);
    }

    if (!shippingAddress || typeof shippingAddress !== "object") {
        throw new AppError("Shipping address is required", 400);
    }

    const {
        name,
        street,
        postalCode,
        city,
        country
    } = shippingAddress;

    if (
        !name ||
        !street ||
        !postalCode ||
        !city ||
        !country
    ) {
        throw new AppError("Complete shipping address is required", 400);
    }

    if (!ALLOWED_DELIVERY_METHODS.includes(deliveryMethod)) {
        throw new AppError("Invalid delivery method", 400);
    }

    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
        throw new AppError("Invalid payment method", 400);
    }

    const mergedItems = new Map();

    for (const item of items) {
        const { productId, quantity } = item;

        if (
            !Number.isInteger(Number(productId)) ||
            Number(productId) <= 0 ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            throw new AppError("Invalid product or quantity", 400);
        }

        const normalizedProductId = Number(productId);

        const existingQuantity =
            mergedItems.get(normalizedProductId) || 0;

        mergedItems.set(
            normalizedProductId,
            existingQuantity + quantity
        );
    }

    const normalizedItems = Array.from(
        mergedItems,
        ([productId, quantity]) => ({
            productId,
            quantity
        })
    );

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        let subtotal = 0;

        const orderItems = [];

        for (const item of normalizedItems) {
            const { productId, quantity } = item;

            const product =
                await productRepository.findProductById(productId);

            if (!product) {
                throw new AppError(
                    `Product ${productId} not found or inactive`,
                404
                );
            }

            if (product.stock_quantity < quantity) {
                throw new AppError(
                    `Insufficient stock for product: ${product.name}`,
                    409
                );
            }

            const unitPrice = Number(product.price);

            const itemTotal =
                unitPrice * quantity;

            subtotal += itemTotal;

            orderItems.push({
                productId: product.id,
                productName: product.name,
                quantity,
                unitPrice
            });
        }

        let shippingAmount;

        if (deliveryMethod === "express") {
            shippingAmount = EXPRESS_SHIPPING_FEE;
        } else {
            shippingAmount =
                subtotal >= FREE_SHIPPING_THRESHOLD
                    ? 0
                    : STANDARD_SHIPPING_FEE;
        }

        const totalAmount =
            subtotal + shippingAmount;

        /*
         * Every newly created order starts with PENDING payment
         * status until the Stripe Checkout payment is completed.
         */
        const paymentStatus = "PENDING";

        const order =
            await orderRepository.createOrder(
                client,
                userId,
                totalAmount,
                shippingAmount,
                {
                    name: String(name).trim(),
                    street: String(street).trim(),
                    postalCode: String(postalCode).trim(),
                    city: String(city).trim(),
                    country: String(country).trim()
                },
                deliveryMethod,
                paymentMethod,
                paymentStatus
            );

        for (const item of orderItems) {

            const reservation =

                await inventoryReservationRepository.reserveInventory(

                    client,

                    order.id,

                    item.productId,

                    item.quantity

                );

            if (!reservation) {

                throw new AppError(
                    `Insufficient stock for product ID: ${item.productId}`,
                    409
                );

            }

            await orderRepository.createOrderItem(

                client,

                order.id,

                item.productId,

                item.quantity,

                item.unitPrice

            );

        }

        await client.query("COMMIT");

        return {
            order,
            items: orderItems
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}

async function getOrdersByUserId(userId) {
    if (!userId) {
        throw new AppError("User ID is required", 400);
    }

    return await orderRepository.findOrdersByUserId(userId);
}

async function getOrderById(orderId, userId) {
    if (!orderId) {
        throw new AppError("Order ID is required", 400);
    }

    if (!userId) {
        throw new AppError("User ID is required", 400);
    }

    const order =
        await orderRepository.findOrderByIdAndUserId(
            orderId,
            userId
        );

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    const items =
        await orderRepository.findOrderItemsByOrderId(
            orderId
        );

    return {
        order,
        items
    };
}

async function updateOrderStatus(orderId, newStatus) {
    if (!orderId) {
        throw new AppError("Order ID is required", 400);
    }

    if (!newStatus) {
        throw new AppError("Order status is required", 400);
    }

    const allowedStatuses = [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
    ];

    if (!allowedStatuses.includes(newStatus)) {
        throw new AppError("Invalid order status", 400);
    }

    const order =
        await orderRepository.findOrderById(orderId);

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    const allowedTransitions = {
        PENDING: [
            "CONFIRMED",
            "CANCELLED"
        ],

        CONFIRMED: [
            "PROCESSING",
            "CANCELLED"
        ],

        PROCESSING: [
            "SHIPPED"
        ],

        SHIPPED: [
            "DELIVERED"
        ],

        DELIVERED: [],

        CANCELLED: []
    };

    const currentStatus = order.status;

    if (
        !allowedTransitions[currentStatus]
            .includes(newStatus)
    ) {
        throw new AppError(
            `Invalid status transition: ${currentStatus} -> ${newStatus}`,
            409
        );
    }

    if (newStatus !== "CANCELLED") {
        return await orderRepository.updateOrderStatus(
            orderId,
            newStatus
        );
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const reservations =
            await inventoryReservationRepository.findActiveReservationsByOrderId(
                orderId,
                client
            );

        for (const reservation of reservations) {
            await inventoryReservationRepository.releaseReservation(
                client,
                reservation.id
            );
        }

        let updatedOrder;

        if (order.payment_status === "PENDING") {
            updatedOrder =
                await orderRepository.updateOrderAndPaymentStatus(
                    orderId,
                    "CANCELLED",
                    "CANCELLED",
                    client
                );
        } else {
            updatedOrder =
                await orderRepository.updateOrderStatus(
                    orderId,
                    "CANCELLED",
                    client
                );
        }

        await client.query("COMMIT");

        return updatedOrder;
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {}

        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createOrder,
    getOrdersByUserId,
    getOrderById,
    updateOrderStatus
};