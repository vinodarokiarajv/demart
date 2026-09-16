const express = require("express");

const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many authentication attempts. Please try again later."
    }
});

router.post(
    "/register",
    authLimiter,
    authController.register
);

router.post(
    "/login",
    authLimiter,
    authController.login
);

router.get("/me", authMiddleware, authController.me);

router.put(
    "/me",
    authMiddleware,
    authController.updateMe
);

router.delete(
    "/me",
    authMiddleware,
    authController.deleteMe
);

module.exports = router;