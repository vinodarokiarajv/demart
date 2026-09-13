const express = require("express");

const adminUserController = require("../controllers/adminUserController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    adminMiddleware,
    adminUserController.getAllUsers
);

router.patch(
    "/:id/role",
    authMiddleware,
    adminMiddleware,
    adminUserController.updateUserRole
);

module.exports = router;