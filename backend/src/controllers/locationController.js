const locationService = require("../services/locationService");

async function getCountries(req, res) {
    try {
        const countries = await locationService.getCountries();

        res.json({
            countries
        });
    } catch (error) {
        console.error("Get countries error:", error);

        res.status(500).json({
            message: "Failed to load countries"
        });
    }
}

async function getRegions(req, res) {
    try {
        const { country } = req.query;

        if (!country) {
            return res.status(400).json({
                message: "Country is required"
            });
        }

        const regions = await locationService.getRegions(country);

        res.json({
            regions
        });
    } catch (error) {
        console.error("Get regions error:", error);

        res.status(500).json({
            message: "Failed to load regions"
        });
    }
}

async function getCities(req, res) {
    try {
        const { country, region } = req.query;

        if (!country || !region) {
            return res.status(400).json({
                message: "Country and region are required"
            });
        }

        const cities = await locationService.getCities(
            country,
            region
        );

        res.json({
            cities
        });
    } catch (error) {
        console.error("Get cities error:", error);

        res.status(500).json({
            message: "Failed to load cities"
        });
    }
}

module.exports = {
    getCountries,
    getRegions,
    getCities
};