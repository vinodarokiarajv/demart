const geoapifyProvider = require("../providers/geoapifyProvider");

function buildAddress({
    street,
    postalCode,
    city,
    region,
    country
}) {
    const parts = [
        street,
        postalCode,
        city,
        region,
        country
    ];

    return parts
        .filter((value) => typeof value === "string" && value.trim())
        .map((value) => value.trim())
        .join(", ");
}

function normalizeAddressValue(value) {
    return typeof value === "string"
        ? value.trim().toLowerCase().replace(/\s+/g, " ")
        : "";
}

function classifyGeocodeMatch(inputAddress, result) {
    const inputStreet = normalizeAddressValue(inputAddress.street);
    const inputPostalCode = normalizeAddressValue(inputAddress.postalCode);
    const inputCity = normalizeAddressValue(inputAddress.city);
    const inputCountry = normalizeAddressValue(inputAddress.country);

    const resultStreet = normalizeAddressValue(result.street);
    const resultHouseNumber = normalizeAddressValue(result.houseNumber);
    const resultPostalCode = normalizeAddressValue(result.postalCode);
    const resultCity = normalizeAddressValue(result.city);
    const resultCountry = normalizeAddressValue(result.country);

    const postalCodeMatches =
        Boolean(inputPostalCode) &&
        Boolean(resultPostalCode) &&
        inputPostalCode === resultPostalCode;

    const cityMatches =
        Boolean(inputCity) &&
        Boolean(resultCity) &&
        (
            inputCity === resultCity ||
            inputCity.includes(resultCity) ||
            resultCity.includes(inputCity)
        );

    const countryMatches =
        Boolean(inputCountry) &&
        Boolean(resultCountry) &&
        inputCountry === resultCountry;

    const streetReturned = Boolean(resultStreet);
    const houseNumberReturned = Boolean(resultHouseNumber);

    const streetMatches =
        streetReturned &&
        (
            inputStreet === resultStreet ||
            inputStreet.includes(resultStreet) ||
            resultStreet.includes(inputStreet)
        );

    let level = "unresolved";

    if (
        result.resultType === "building" &&
        streetMatches &&
        streetReturned &&
        houseNumberReturned &&
        postalCodeMatches &&
        cityMatches &&
        countryMatches
    ) {
        level = "building";
    } else if (
        streetMatches &&
        postalCodeMatches &&
        cityMatches &&
        countryMatches
    ) {
        level = "street";
    } else if (
        result.resultType === "suburb" ||
        result.resultType === "district" ||
        result.resultType === "city"
    ) {
        level = "area";
    }

    return {
        level,
        streetMatches,
        postalCodeMatches,
        cityMatches,
        countryMatches,
        streetReturned,
        houseNumberReturned
    };
}

async function geocodeAddress(address) {
    if (!address || typeof address !== "object") {
        throw new Error("Address is required");
    }

    const {
        street,
        postalCode,
        city,
        region,
        country
    } = address;

    if (!street) {
        throw new Error("Street is required");
    }

    if (!postalCode) {
        throw new Error("Postal code is required");
    }

    if (!city) {
        throw new Error("City is required");
    }

    if (!country) {
        throw new Error("Country is required");
    }

    const formattedAddress = buildAddress({
        street,
        postalCode,
        city,
        region,
        country
    });

    const result = await geoapifyProvider.geocodeAddress(
        formattedAddress
    );

    if (!result) {
        return null;
    }

    return {
        ...result,
        match: classifyGeocodeMatch(address, result)
    };
}

async function reverseGeocode(latitude, longitude) {
    return geoapifyProvider.reverseGeocode(latitude, longitude);
}

async function autocompleteAddress(text, countryCode = null) {
    if (!text || typeof text !== "string" || !text.trim()) {
        throw new Error("Search text is required");
    }

    if (countryCode !== null && typeof countryCode !== "string") {
        throw new Error("Country code must be a string");
    }

    return geoapifyProvider.autocompleteAddress(
        text.trim(),
        countryCode?.trim() || null
    );
}

module.exports = {
    geocodeAddress,
    reverseGeocode,
    autocompleteAddress
};
