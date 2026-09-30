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
        const country = req.query.country?.trim();

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
        const country = req.query.country?.trim();
        const region = req.query.region?.trim();

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

const geocodingService = require("../services/geocodingService");

async function geocodeAddress(req, res) {
    try {
        const result = await geocodingService.geocodeAddress(req.body);

        if (!result) {
            return res.status(404).json({
                message: "Address could not be geocoded"
            });
        }

        res.json({
            location: result
        });
    } catch (error) {
        console.error("Geocode address error:", error);

        const clientErrors = [
            "Address is required",
            "Street is required",
            "Postal code is required",
            "City is required",
            "Country is required"
        ];

        if (clientErrors.includes(error.message)) {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(502).json({
            message: "Failed to geocode address"
        });
    }
}

async function reverseGeocode(req, res) {
    try {
        const latitude = Number(req.query.latitude);
        const longitude = Number(req.query.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return res.status(400).json({
                message: "Valid latitude and longitude are required"
            });
        }

        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({
                message: "Latitude must be between -90 and 90"
            });
        }

        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({
                message: "Longitude must be between -180 and 180"
            });
        }

        const result = await geocodingService.reverseGeocode(
            latitude,
            longitude
        );

        if (!result) {
            return res.status(404).json({
                message: "Location could not be reverse geocoded"
            });
        }

        res.json({
            location: result
        });
    } catch (error) {
        console.error("Reverse geocode error:", error);

        res.status(502).json({
            message: "Failed to reverse geocode location"
        });
    }
}

async function autocompleteAddress(req, res) {
    try {
        const text = req.query.text?.trim();
        const countryCode = req.query.countryCode?.trim() || null;

        if (!text) {
            return res.status(400).json({
                message: "Search text is required"
            });
        }

        if (countryCode && !/^[A-Za-z]{2}$/.test(countryCode)) {
            return res.status(400).json({
                message: "Country code must be a two-letter ISO code"
            });
        }

        const results = await geocodingService.autocompleteAddress(
            text,
            countryCode
        );

        res.json({
            results
        });
    } catch (error) {
        console.error("Autocomplete address error:", error);

        if (
            error.message === "Search text is required" ||
            error.message === "Country code must be a string"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(502).json({
            message: "Failed to autocomplete address"
        });
    }
}

module.exports = {
    getCountries,
    getRegions,
    getCities,
    geocodeAddress,
    reverseGeocode,
    autocompleteAddress
};