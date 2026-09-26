const pool = require("../db/db");

async function getStoresByLocation(locationId) {
    const result = await pool.query(
        `
        SELECT
            id,
            location_id,
            name,
            address,
            timezone
        FROM stores
        WHERE location_id = $1
          AND is_active = true
        ORDER BY name
        `,
        [locationId]
    );

    return result.rows;
}

module.exports = {
    getStoresByLocation
};