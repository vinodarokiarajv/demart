const orderService = require("../services/orderService");
const paymentService = require("../services/paymentService");

async function createOrder(req, res) {
    let createdOrder = null;

    try {
        const userId = req.user.id;
        const customerEmail = req.user.email;

        const {
            items,
            shippingAddress,
            deliveryMethod,
            paymentMethod
        } = req.body;

        if (paymentMethod !== "card") {
            return res.status(400).json({
                message: "PayPal payments are not available yet. Please select Credit/Debit Card."
            });
        }

        createdOrder = await orderService.createOrder(
            userId,
            items,
            shippingAddress,
            deliveryMethod,
            paymentMethod
        );

        const idempotencyKey =
            `demart-order-${createdOrder.order.id}`;

        const paymentResult =
            await paymentService.createCheckoutSession(
                createdOrder.order,
                createdOrder.items,
                idempotencyKey
            );

        return res.status(201).json({
            order: createdOrder.order,
            items: createdOrder.items,
            payment: paymentResult
        });
    } catch (error) {
        console.error("Create order error:", error);

        if (createdOrder && createdOrder.order && createdOrder.order.id) {
            try {
                await orderService.updateOrderStatus(
                    createdOrder.order.id,
                    "CANCELLED"
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up order after payment setup failure:",
                    cleanupError
                );
            }
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Unable to create order"
        });
    }
}

async function getOrders(req, res) {
    try {
        const orders = await orderService.getOrdersByUserId(
            req.user.id
        );

        res.json({
            orders
        });
    } catch (error) {
        console.error("Get orders error:", error);

        res.status(500).json({
            message: "Failed to retrieve orders"
        });
    }
}

async function getOrderById(req, res) {
    try {
        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const result = await orderService.getOrderById(
            orderId,
            req.user.id
        );

        if (!result) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.json(result);
    } catch (error) {
        console.error("Get order error:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to retrieve order"
        });
    }
}

module.exports = {
    createOrder,
    getOrders,
    getOrderById
};
