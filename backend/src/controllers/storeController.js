const storeService = require("../services/storeService");

async function getStoresByLocation(req, res) {
    try {
        const { locationId } = req.query;

        if (!locationId) {
            return res.status(400).json({
                message: "Location ID is required"
            });
        }

        const stores = await storeService.getStoresByLocation(locationId);

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