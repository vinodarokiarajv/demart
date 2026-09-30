const pool = require("../db/db");

async function createTrackingUpdate(
    deliveryId,
    status,
    latitude,
    longitude,
    note,
    recordedAt,
    client = pool
) {
    const result = await client.query(
        `
        INSERT INTO delivery_tracking (
            delivery_id,
            status,
            latitude,
            longitude,
            note,
            recorded_at
        )
        VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_TIMESTAMP))
        RETURNING *
        `,
        [
            deliveryId,
            status,
            latitude,
            longitude,
            note,
            recordedAt
        ]
    );

    return result.rows[0];
}

async function findTrackingByDeliveryId(
    deliveryId,
    client = pool
) {
    const result = await client.query(
        `
        SELECT *
        FROM delivery_tracking
        WHERE delivery_id = $1
        ORDER BY recorded_at ASC, id ASC
        `,
        [deliveryId]
    );

    return result.rows;
}

async function findLatestTrackingByDeliveryId(
    deliveryId,
    client = pool
) {
    const result = await client.query(
        `
        SELECT *
        FROM delivery_tracking
        WHERE delivery_id = $1
        ORDER BY recorded_at DESC, id DESC
        LIMIT 1
        `,
        [deliveryId]
    );

    return result.rows[0];
}

module.exports = {
    createTrackingUpdate,
    findTrackingByDeliveryId,
    findLatestTrackingByDeliveryId
};