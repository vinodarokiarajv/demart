const pool = require("../db/db");

async function getCountries() {
    const result = await pool.query(`
        SELECT
            country_name AS country
        FROM geo_countries
        ORDER BY country_name
    `);

    return result.rows;
}

async function getRegions(country) {
    const result = await pool.query(
        `
        SELECT
            r.name AS region
        FROM geo_admin1_regions r
        INNER JOIN geo_countries c
            ON c.iso_code = r.country_code
        WHERE LOWER(TRIM(c.country_name)) = LOWER(TRIM($1))
        ORDER BY r.name
        `,
        [country]
    );

    return result.rows;
}

async function getCities(country, region) {
    const result = await pool.query(
        `
        SELECT
            gc.geoname_id AS id,
            gc.name AS city,
            gc.timezone
        FROM geo_cities gc
        INNER JOIN geo_countries c
            ON c.iso_code = gc.country_code
        INNER JOIN geo_admin1_regions r
            ON r.country_code = gc.country_code
           AND r.admin1_code = gc.admin1_code
        WHERE LOWER(TRIM(c.country_name)) = LOWER(TRIM($1))
          AND LOWER(TRIM(r.name)) = LOWER(TRIM($2))
        ORDER BY gc.name
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
