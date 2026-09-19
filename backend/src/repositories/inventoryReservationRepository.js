const pool = require("../db/db");

async function reserveInventory(
    client,
    orderId,
    productId,
    quantity
) {
    const stockResult = await client.query(
        `
        UPDATE products
        SET stock_quantity = stock_quantity - $2
        WHERE id = $1
          AND is_active = true
          AND stock_quantity >= $2
        RETURNING
            id,
            name,
            stock_quantity
        `,
        [productId, quantity]
    );

    if (stockResult.rows.length === 0) {
        return null;
    }

    const reservationResult = await client.query(
        `
        INSERT INTO inventory_reservations (
            order_id,
            product_id,
            quantity,
            status
        )
        VALUES ($1, $2, $3, 'RESERVED')
        RETURNING
            id,
            order_id,
            product_id,
            quantity,
            status,
            reserved_at,
            released_at,
            consumed_at
        `,
        [
            orderId,
            productId,
            quantity
        ]
    );

    return {
        reservation: reservationResult.rows[0],
        product: stockResult.rows[0]
    };
}

async function findReservationsByOrderId(orderId) {
    const result = await pool.query(
        `
        SELECT
            id,
            order_id,
            product_id,
            quantity,
            status,
            reserved_at,
            released_at,
            consumed_at
        FROM inventory_reservations
        WHERE order_id = $1
        ORDER BY id
        `,
        [orderId]
    );

    return result.rows;
}

async function consumeReservation(client, reservationId) {
    const result = await client.query(
        `
        UPDATE inventory_reservations
        SET
            status = 'CONSUMED',
            consumed_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND status = 'RESERVED'
        RETURNING
            id,
            order_id,
            product_id,
            quantity,
            status,
            reserved_at,
            released_at,
            consumed_at
        `,
        [reservationId]
    );

    return result.rows[0] || null;
}

async function releaseReservation(client, reservationId) {
    const reservationResult = await client.query(
        `
        UPDATE inventory_reservations
        SET
            status = 'RELEASED',
            released_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND status = 'RESERVED'
        RETURNING
            id,
            order_id,
            product_id,
            quantity,
            status,
            reserved_at,
            released_at,
            consumed_at
        `,
        [reservationId]
    );

    if (reservationResult.rows.length === 0) {
        return null;
    }

    const reservation = reservationResult.rows[0];

    const stockResult = await client.query(
        `
        UPDATE products
        SET stock_quantity = stock_quantity + $2
        WHERE id = $1
        RETURNING
            id,
            name,
            stock_quantity
        `,
        [
            reservation.product_id,
            reservation.quantity
        ]
    );

    return {
        reservation,
        product: stockResult.rows[0]
    };
}

async function findActiveReservationsByOrderId(
    orderId,
    client = pool
) {
    const result = await client.query(
        `
        SELECT
            id,
            order_id,
            product_id,
            quantity,
            status,
            reserved_at,
            released_at,
            consumed_at
        FROM inventory_reservations
        WHERE order_id = $1
          AND status = 'RESERVED'
        ORDER BY id
        `,
        [orderId]
    );

    return result.rows;
}

module.exports = {
    reserveInventory,
    findReservationsByOrderId,
    consumeReservation,
    releaseReservation,
    findActiveReservationsByOrderId
};