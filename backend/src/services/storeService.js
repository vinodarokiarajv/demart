const storeRepository = require("../repositories/storeRepository");

async function getStoresByLocation(locationId) {
    if (!locationId) {
        throw new Error("Location ID is required");
    }

    return storeRepository.getStoresByLocation(locationId);
}

module.exports = {
    getStoresByLocation
};