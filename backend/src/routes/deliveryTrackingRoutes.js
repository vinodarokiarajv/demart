const express = require("express");
const deliveryTrackingController =
    require("../controllers/deliveryTrackingController");
const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/:deliveryId/latest",
    authMiddleware,
    deliveryTrackingController.getLatestTracking
);

router.get(
    "/:deliveryId",
    authMiddleware,
    deliveryTrackingController.getTrackingHistory
);

module.exports = router;