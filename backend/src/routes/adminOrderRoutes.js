const express = require("express");

const adminOrderController =
    require("../controllers/adminOrderController");

const authMiddleware =
    require("../middleware/authMiddleware");

const adminMiddleware =
    require("../middleware/adminMiddleware");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    adminMiddleware,
    adminOrderController.getAllOrders
);

router.patch(
    "/:id/status",
    authMiddleware,
    adminMiddleware,
    adminOrderController.updateOrderStatus
);

module.exports = router;