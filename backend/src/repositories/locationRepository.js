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

module.exports = {
    getCountries,
    getRegions,
    getCities
};