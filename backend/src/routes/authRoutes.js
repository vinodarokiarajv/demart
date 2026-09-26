const express = require("express");

const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many login attempts. Please try again later."
    }
});

const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many registration attempts. Please try again later."
    }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message:
            "Too many password reset requests. Please try again later."
    }
});

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message:
            "Too many password reset attempts. Please try again later."
    }
});

router.post(
    "/register",
    registrationLimiter,
    authController.register
);

router.post(
    "/login",
    loginLimiter,
    authController.login
);

router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    authController.forgotPassword
);

router.post(
    "/reset-password",
    resetPasswordLimiter,
    authController.resetPassword
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