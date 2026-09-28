const storeService = require("../services/storeService");

async function getStoresByLocation(req, res) {
    try {
        const { locationId } = req.query;

        if (!locationId) {
            return res.status(400).json({
                message: "Location ID is required"
            });
        }

        if (!/^\d+$/.test(locationId) || Number(locationId) <= 0) {

            return res.status(400).json({

                message: "Location ID must be a positive integer"

            });

        }

        const stores =
            await storeService.getStoresByLocation(
                Number(locationId)
            );

        res.json({
            stores
        });
    } catch (error) {
        console.error("Get stores error:", error);

        res.status(500).json({
            message: "Failed to load stores"
        });
    }
}

module.exports = {
    getStoresByLocation
};