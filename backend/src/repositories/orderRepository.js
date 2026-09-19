const pool = require("../db/db");

async function createOrder(
    client,
    userId,
    totalAmount,
    shippingAmount,
    shippingAddress,
    deliveryMethod,
    paymentMethod,
    paymentStatus
) {
    const result = await client.query(
        `
        INSERT INTO orders (
            user_id,
            total_amount,
            shipping_amount,
            shipping_name,
            shipping_street,
            shipping_postal_code,
            shipping_city,
            shipping_country,
            delivery_method,
            payment_method,
            payment_status
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11
        )
        RETURNING
            id,
            user_id,
            status,
            total_amount,
            shipping_amount,
            shipping_name,
            shipping_street,
            shipping_postal_code,
            shipping_city,
            shipping_country,
            delivery_method,
            payment_method,
            payment_status,
            created_at
        `,
        [
            userId,
            totalAmount,
            shippingAmount,
            shippingAddress.name,
            shippingAddress.street,
            shippingAddress.postalCode,
            shippingAddress.city,
            shippingAddress.country,
            deliveryMethod,
            paymentMethod,
            paymentStatus
        ]
    );

    return result.rows[0];
}

async function createOrderItem(
    client,
    orderId,
    productId,
    quantity,
    unitPrice
) {
    const result = await client.query(
        `
        INSERT INTO order_items
            (order_id, product_id, quantity, unit_price)
        VALUES
            ($1, $2, $3, $4)
        RETURNING id, order_id, product_id, quantity, unit_price
        `,
        [orderId, productId, quantity, unitPrice]
    );

    return result.rows[0];
}

async function findOrdersByUserId(userId) {
    const result = await pool.query(
        `
        SELECT
            id,
            user_id,
            status,
            total_amount,
            shipping_amount,
            shipping_name,
            shipping_street,
            shipping_postal_code,
            shipping_city,
            shipping_country,
            delivery_method,
            payment_method,
            payment_status,
            created_at
        FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId]
    );

    return result.rows;
}

async function findOrderByIdAndUserId(orderId, userId) {
    const result = await pool.query(
        `
        SELECT
            id,
            user_id,
            status,
            total_amount,
            shipping_amount,
            shipping_name,
            shipping_street,
            shipping_postal_code,
            shipping_city,
            shipping_country,
            delivery_method,
            payment_method,
            payment_status,
            created_at
        FROM orders
        WHERE id = $1
          AND user_id = $2
        `,
        [orderId, userId]
    );

    return result.rows[0];
}

async function findOrderItemsByOrderId(orderId) {
    const result = await pool.query(
        `
        SELECT
            oi.id,
            oi.order_id,
            oi.product_id,
            p.name AS product_name,
            p.image_url,
            oi.quantity,
            oi.unit_price
        FROM order_items oi
        INNER JOIN products p
            ON p.id = oi.product_id
        WHERE oi.order_id = $1
        ORDER BY oi.id
        `,
        [orderId]
    );

    return result.rows;
}

async function findAllOrders() {
    const result = await pool.query(
        `
        SELECT
            o.id,
            o.user_id,
            u.name AS customer_name,
            u.email AS customer_email,
            o.status,
            o.total_amount,
            o.shipping_amount,
            o.delivery_method,
            o.payment_method,
            o.payment_status,
            o.created_at
        FROM orders o
        INNER JOIN users u
            ON u.id = o.user_id
        ORDER BY o.created_at DESC
        `
    );

    return result.rows;
}

async function updateOrderStatus(
    orderId,
    status,
    client = pool
) {
    const result = await client.query(
        `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        RETURNING
            id,
            user_id,
            status,
            total_amount,
            shipping_amount,
            delivery_method,
            payment_method,
            payment_status,
            created_at
        `,
        [status, orderId]
    );

    return result.rows[0];
}

async function updateOrderAndPaymentStatus(
    orderId,
    orderStatus,
    paymentStatus,
    client = pool
) {
    const result = await client.query(
        `
        UPDATE orders
        SET
            status = $1,
            payment_status = $2
        WHERE id = $3
        RETURNING
            id,
            user_id,
            status,
            total_amount,
            shipping_amount,
            delivery_method,
            payment_method,
            payment_status,
            created_at
        `,
        [orderStatus, paymentStatus, orderId]
    );

    return result.rows[0];
}

async function updatePaymentStatus(
    orderId,
    paymentStatus,
    client = pool
) {
    const result = await client.query(
        `
        UPDATE orders
        SET payment_status = $1
        WHERE id = $2
        RETURNING
            id,
            user_id,
            status,
            total_amount,
            shipping_amount,
            delivery_method,
            payment_method,
            payment_status,
            created_at
        `,
        [paymentStatus, orderId]
    );

    return result.rows[0];
}

async function findOrderById(orderId) {
    const result = await pool.query(
        `
        SELECT
            id,
            user_id,
            status,
            total_amount,
            shipping_amount,
            shipping_name,
            shipping_street,
            shipping_postal_code,
            shipping_city,
            shipping_country,
            delivery_method,
            payment_method,
            payment_status,
            created_at
        FROM orders
        WHERE id = $1
        `,
        [orderId]
    );

    return result.rows[0];
}

module.exports = {
    createOrder,
    createOrderItem,
    findOrdersByUserId,
    findOrderByIdAndUserId,
    findOrderItemsByOrderId,
    findAllOrders,
    updateOrderStatus,
    updateOrderAndPaymentStatus,
    updatePaymentStatus,
    findOrderById
};