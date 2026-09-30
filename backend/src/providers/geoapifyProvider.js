const config = require("../config");

const GEOCODING_URL =
    "https://api.geoapify.com/v1/geocode/search";

const REVERSE_GEOCODING_URL =
    "https://api.geoapify.com/v1/geocode/reverse";

const AUTOCOMPLETE_URL =
    "https://api.geoapify.com/v1/geocode/autocomplete";

async function geocodeAddress(address) {
    if (!address || typeof address !== "string") {
        throw new Error("Address is required");
    }

    const url = new URL(GEOCODING_URL);

    url.searchParams.set("text", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("apiKey", config.geoapify.apiKey);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Geoapify geocoding request failed with status ${response.status}`
        );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }

    const result = data.results[0];

    return {
        latitude: result.lat,
        longitude: result.lon,
        formattedAddress: result.formatted || null,
        country: result.country || null,
        region: result.state || null,
        city: result.city || result.town || result.village || null,
        postalCode: result.postcode || null,
        street: result.street || null,
        houseNumber: result.housenumber || null,
        resultType: result.result_type || null,
        matchType: result.rank?.match_type || null,
        confidence: result.rank?.confidence ?? null,
        confidenceStreetLevel:
            result.rank?.confidence_street_level ?? null,
        confidenceBuildingLevel:
            result.rank?.confidence_building_level ?? null
    };
}

async function reverseGeocode(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Valid latitude and longitude are required");
    }

    const url = new URL(REVERSE_GEOCODING_URL);

    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("apiKey", config.geoapify.apiKey);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Geoapify reverse geocoding request failed with status ${response.status}`
        );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }

    const result = data.results[0];

    return {
        latitude: result.lat,
        longitude: result.lon,
        formattedAddress: result.formatted || null,
        country: result.country || null,
        region: result.state || null,
        city: result.city || result.town || result.village || null,
        postalCode: result.postcode || null
    };
}

async function autocompleteAddress(text, countryCode = null) {
    if (!text || typeof text !== "string") {
        throw new Error("Search text is required");
    }

    const url = new URL(AUTOCOMPLETE_URL);

    url.searchParams.set("text", text.trim());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("apiKey", config.geoapify.apiKey);

    if (countryCode) {
        url.searchParams.set(
            "filter",
            `countrycode:${countryCode.toLowerCase()}`
        );
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Geoapify autocomplete request failed with status ${response.status}`
        );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return [];
    }

    return data.results.map((result) => ({
        latitude: result.lat,
        longitude: result.lon,
        formattedAddress: result.formatted || null,
        country: result.country || null,
        countryCode: result.country_code || null,
        region: result.state || null,
        city: result.city || result.town || result.village || null,
        postalCode: result.postcode || null,
        street: result.street || null,
        houseNumber: result.housenumber || null,
        resultType: result.result_type || null
    }));
}

module.exports = {
    geocodeAddress,
    reverseGeocode,
    autocompleteAddress
};
