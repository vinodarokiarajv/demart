const pool = require("../db/db");

async function createDelivery(orderId, client = pool) {
    const result = await client.query(
        `
        INSERT INTO deliveries (
            order_id,
            status
        )
        VALUES ($1, 'CREATED')
        RETURNING *
        `,
        [orderId]
    );

    return result.rows[0];
}

async function findDeliveryByOrderId(orderId, client = pool) {
    const result = await client.query(
        `
        SELECT *
        FROM deliveries
        WHERE order_id = $1
        `,
        [orderId]
    );

    return result.rows[0];
}

async function findDeliveryById(deliveryId, client = pool) {
    const result = await client.query(
        `
        SELECT *
        FROM deliveries
        WHERE id = $1
        `,
        [deliveryId]
    );

    return result.rows[0];
}

async function findDeliveryByIdAndUserId(
    deliveryId,
    userId,
    client = pool
) {
    const result = await client.query(
        `
        SELECT d.*
        FROM deliveries d
        INNER JOIN orders o
            ON o.id = d.order_id
        WHERE d.id = $1
          AND o.user_id = $2
        `,
        [deliveryId, userId]
    );

    return result.rows[0];
}

async function updateDeliveryStatus(
    deliveryId,
    status,
    client = pool
) {
    const timestampColumn = {
        ASSIGNED: "assigned_at",
        PICKED_UP: "picked_up_at",
        OUT_FOR_DELIVERY: "out_for_delivery_at",
        DELIVERED: "delivered_at"
    }[status];

    const query = timestampColumn
        ? `
            UPDATE deliveries
            SET
                status = $2,
                ${timestampColumn} = COALESCE(
                    ${timestampColumn},
                    CURRENT_TIMESTAMP
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `
        : `
            UPDATE deliveries
            SET
                status = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

    const result = await client.query(
        query,
        [deliveryId, status]
    );

    return result.rows[0];
}

module.exports = {
    createDelivery,
    findDeliveryByOrderId,
    findDeliveryById,
    findDeliveryByIdAndUserId,
    updateDeliveryStatus
};
