const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

const router = express.Router();

router.post(
    "/chat",
    authMiddleware,
    aiController.chat
);

module.exports = router;
