const orderService = require("../services/orderService");
const orderRepository = require("../repositories/orderRepository");

async function getAllOrders(req, res) {
    try {
        const orders = await orderRepository.findAllOrders();

        res.status(200).json({
            orders
        });
    } catch (error) {
        console.error("Failed to retrieve admin orders:", error);

        res.status(500).json({
            message: "Failed to retrieve orders"
        });
    }
}

async function updateOrderStatus(req, res) {

    try {
        const { id } = req.params;
        const { status } = req.body;

        const order =
            await orderService.updateOrderStatus(
                id,
                status
            );

        res.status(200).json({
            message: "Order status updated successfully",
            order
        });

    } catch (error) {

        console.error(
            "Failed to update order status:",
            error
        );

        if (
            error.message === "Order not found"
        ) {
            return res.status(404).json({
                message: error.message
            });
        }

        res.status(400).json({
            message: error.message
        });
    }
}

module.exports = {
    getAllOrders,
    updateOrderStatus
};