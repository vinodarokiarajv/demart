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

        const result = await orderService.createOrder(
            userId,
            items,
            shippingAddress,
            deliveryMethod,
            paymentMethod
        );

        createdOrder = result.order;

        const idempotencyKey = `demart-order-${createdOrder.id}`;

        const paymentResult =
            await paymentService.createCheckoutSession({
                order: createdOrder,
                items: result.items,
                customerEmail,
                idempotencyKey
            });

        return res.status(201).json({
            message: "Checkout session created",
            order: createdOrder,
            items: result.items,
            payment: paymentResult
        });
    } catch (error) {
        console.error("Create order error:", error);

        if (createdOrder && createdOrder.id) {
            try {
                await orderService.updateOrderStatus(
                    createdOrder.id,
                    "CANCELLED"
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up order after payment setup failure:",
                    cleanupError
                );
            }
        }

        return res.status(400).json({
            message: error.message
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

        res.status(500).json({
            message: "Failed to retrieve order"
        });
    }
}

module.exports = {
    createOrder,
    getOrders,
    getOrderById
};
