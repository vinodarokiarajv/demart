const orderService = require("../services/orderService");

async function createOrder(req, res) {
    try {
        const userId = req.user.id;
        const { items } = req.body;

        const result = await orderService.createOrder(
            userId,
            items
        );

        res.status(201).json({
            message: "Order created successfully",
            order: result.order,
            items: result.items
        });
    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: error.message
        });
    }
}

async function getOrders(req, res) {
    try {
        const userId = req.user.id;

        const orders = await orderService.getOrdersByUserId(
            userId
        );

        res.status(200).json({
    orders
});
    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: error.message
        });
    }
}

async function getOrderById(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const order = await orderService.getOrderById(
            id,
            userId
        );

        res.status(200).json({
    order: order.order,
    items: order.items
});
    } catch (error) {
        console.error(error);

        res.status(404).json({
            message: error.message
        });
    }
}

module.exports = {
    createOrder,
    getOrders,
    getOrderById
};