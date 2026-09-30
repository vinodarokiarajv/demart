const deliveryTrackingService =
    require("../services/deliveryTrackingService");

async function getTrackingHistory(req, res) {
    try {
        const deliveryId = Number(req.params.deliveryId);
        const userId = req.user.id;

        if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
            return res.status(400).json({
                message: "Invalid delivery ID"
            });
        }

        const tracking =
            await deliveryTrackingService.getCustomerTrackingHistory(
                deliveryId,
                userId
            );

        return res.status(200).json({
            tracking
        });
    } catch (error) {
        console.error(
            "Get delivery tracking history error:",
            error
        );

        if (error.message === "Delivery not found") {
            return res.status(404).json({
                message: "Delivery not found"
            });
        }

        return res.status(500).json({
            message: "Failed to get delivery tracking history"
        });
    }
}

async function getLatestTracking(req, res) {
    try {
        const deliveryId = Number(req.params.deliveryId);
        const userId = req.user.id;

        if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
            return res.status(400).json({
                message: "Invalid delivery ID"
            });
        }

        const tracking =
            await deliveryTrackingService.getCustomerLatestTracking(
                deliveryId,
                userId
            );

        return res.status(200).json({
            tracking
        });
    } catch (error) {
        console.error(
            "Get latest delivery tracking error:",
            error
        );

        if (error.message === "Delivery not found") {
            return res.status(404).json({
                message: "Delivery not found"
            });
        }

        return res.status(500).json({
            message: "Failed to get latest delivery tracking"
        });
    }
}

module.exports = {
    getTrackingHistory,
    getLatestTracking
};