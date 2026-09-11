const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, orderController.createOrder);

router.get("/", authMiddleware, orderController.getOrders);

router.get("/:id", authMiddleware, orderController.getOrderById);

module.exports = router;