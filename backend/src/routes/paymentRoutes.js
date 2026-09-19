const express = require("express");

const paymentController = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    paymentController.handleStripeWebhook
);

router.post(
    "/cancel",
    express.json(),
    authMiddleware,
    paymentController.cancelCheckout
);

module.exports = router;