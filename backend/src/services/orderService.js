const pool = require("../db/db");
const orderRepository = require("../repositories/orderRepository");
const productRepository = require("../repositories/productRepository");

async function createOrder(userId, items) {
    if (!userId) {
        throw new Error("User ID is required");
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Order must contain at least one item");
    }

    const mergedItems = new Map();

for (const item of items) {
    const { productId, quantity } = item;

    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Invalid product or quantity");
    }

    const existingQuantity = mergedItems.get(productId) || 0;

    mergedItems.set(
        productId,
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

        let totalAmount = 0;
        const orderItems = [];

        for (const item of normalizedItems) {
            const { productId, quantity } = item;

            if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
                throw new Error("Invalid product or quantity");
            }

            const product = await productRepository.findProductById(productId);

            if (!product) {
                throw new Error(`Product ${productId} not found or inactive`);
            }

            if (product.stock_quantity < quantity) {
                throw new Error(
                    `Insufficient stock for product: ${product.name}`
                );
            }

            const unitPrice = Number(product.price);
            const itemTotal = unitPrice * quantity;

            totalAmount += itemTotal;

            orderItems.push({
                productId: product.id,
                quantity,
                unitPrice
            });
        }

        const order = await orderRepository.createOrder(
    client,
    userId,
    totalAmount
);

for (const item of orderItems) {
    const updatedProduct = await productRepository.decreaseStock(
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

    const order = await orderRepository.findOrderByIdAndUserId(
        orderId,
        userId
    );

    if (!order) {
        throw new Error("Order not found");
    }

    const items = await orderRepository.findOrderItemsByOrderId(
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

    const order = await orderRepository.findOrderById(orderId);

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

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
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