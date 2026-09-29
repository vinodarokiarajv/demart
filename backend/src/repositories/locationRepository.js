const pool = require("../db/db");

async function getCountries() {
    const result = await pool.query(`
        SELECT DISTINCT country
        FROM locations
        WHERE is_active = true
        ORDER BY country
    `);

    return result.rows;
}

async function getRegions(country) {
    const result = await pool.query(
        `
        SELECT DISTINCT region
        FROM locations
        WHERE country = $1
          AND is_active = true
        ORDER BY region
        `,
        [country]
    );

    return result.rows;
}

async function getCities(country, region) {
    const result = await pool.query(
        `
        SELECT
            id,
            city,
            timezone
        FROM locations
        WHERE country = $1
          AND region = $2
          AND is_active = true
        ORDER BY city
        `,
        [country, region]
    );

    return result.rows;
}

async function isValidCityCountry(city, country) {
    const result = await pool.query(
        `
        SELECT 1
        FROM geo_cities gc
        INNER JOIN geo_countries gco
            ON gco.iso_code = gc.country_code
        WHERE LOWER(TRIM(gc.name)) = LOWER(TRIM($1))
          AND LOWER(TRIM(gco.country_name)) = LOWER(TRIM($2))
        LIMIT 1
        `,
        [city, country]
    );

    return result.rowCount > 0;
}

module.exports = {
    getCountries,
    getRegions,
    getCities,
    isValidCityCountry
};