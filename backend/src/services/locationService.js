const locationRepository = require("../repositories/locationRepository");

async function getCountries() {
    return locationRepository.getCountries();
}

async function getRegions(country) {
    if (!country) {
        throw new Error("Country is required");
    }

    return locationRepository.getRegions(country);
}

async function getCities(country, region) {
    if (!country) {
        throw new Error("Country is required");
    }

    if (!region) {
        throw new Error("Region is required");
    }

    return locationRepository.getCities(country, region);
}

module.exports = {
    getCountries,
    getRegions,
    getCities
};