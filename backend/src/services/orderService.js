const pool = require("../db/db");

const orderRepository = require("../repositories/orderRepository");
const productRepository = require("../repositories/productRepository");

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
        throw new Error("User ID is required");
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Order must contain at least one item");
    }

    if (!shippingAddress || typeof shippingAddress !== "object") {
        throw new Error("Shipping address is required");
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
        throw new Error("Complete shipping address is required");
    }

    if (!ALLOWED_DELIVERY_METHODS.includes(deliveryMethod)) {
        throw new Error("Invalid delivery method");
    }

    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
        throw new Error("Invalid payment method");
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
            throw new Error("Invalid product or quantity");
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
                throw new Error(
                    `Product ${productId} not found or inactive`
                );
            }

            if (product.stock_quantity < quantity) {
                throw new Error(
                    `Insufficient stock for product: ${product.name}`
                );
            }

            const unitPrice = Number(product.price);

            const itemTotal =
                unitPrice * quantity;

            subtotal += itemTotal;

            orderItems.push({
                productId: product.id,
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
         * Payment integration is not implemented yet.
         * Therefore every newly created order starts with
         * PENDING payment status.
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
            const updatedProduct =
                await productRepository.decreaseStock(
                    client,
                    item.productId,
                    item.quantity
                );

            if (!updatedProduct) {
                throw new Error(
                    `Insufficient stock for product ID: ${item.productId}`
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
        throw new Error("User ID is required");
    }

    return await orderRepository.findOrdersByUserId(userId);
}

async function getOrderById(orderId, userId) {
    if (!orderId) {
        throw new Error("Order ID is required");
    }

    if (!userId) {
        throw new Error("User ID is required");
    }

    const order =
        await orderRepository.findOrderByIdAndUserId(
            orderId,
            userId
        );

    if (!order) {
        throw new Error("Order not found");
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
        throw new Error("Order ID is required");
    }

    if (!newStatus) {
        throw new Error("Order status is required");
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
        throw new Error("Invalid order status");
    }

    const order =
        await orderRepository.findOrderById(orderId);

    if (!order) {
        throw new Error("Order not found");
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
        throw new Error(
            `Invalid status transition: ${currentStatus} -> ${newStatus}`
        );
    }

    return await orderRepository.updateOrderStatus(
        orderId,
        newStatus
    );
}

module.exports = {
    createOrder,
    getOrdersByUserId,
    getOrderById,
    updateOrderStatus
};