const deliveryTrackingService =
    require("../services/deliveryTrackingService");

async function addTrackingUpdate(req, res) {
    try {
        const deliveryId = Number(req.params.deliveryId);

        if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
            return res.status(400).json({
                message: "Invalid delivery ID"
            });
        }

        const {
            status,
            latitude,
            longitude,
            note,
            recordedAt
        } = req.body;

        const tracking =
            await deliveryTrackingService.addTrackingUpdate({
                deliveryId,
                status,
                latitude,
                longitude,
                note,
                recordedAt
            });

        return res.status(201).json({
            tracking
        });
    } catch (error) {
        console.error(
            "Add delivery tracking update error:",
            error
        );

        if (
            error.message === "Delivery not found" ||
            error.message ===
                "Invalid delivery tracking status"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        if (
            error.message ===
            "Latitude and longitude must be provided together"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to add delivery tracking update"
        });
    }
}

module.exports = {
    addTrackingUpdate
};