const express = require("express");
const deliveryTrackingUpdateController =
    require("../controllers/deliveryTrackingUpdateController");
const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/:deliveryId",
    authMiddleware,
    deliveryTrackingUpdateController.addTrackingUpdate
);

module.exports = router;