const pool = require("../db/db");

async function createPayment(client, {
    orderId,
    provider,
    amount,
    currency = "EUR",
    status = "PENDING",
    idempotencyKey = null
}) {
    const result = await client.query(
        `
        INSERT INTO payments (
            order_id,
            provider,
            amount,
            currency,
            status,
            idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            orderId,
            provider,
            amount,
            currency,
            status,
            idempotencyKey
        ]
    );

    return result.rows[0];
}

async function findPaymentById(id, client = pool) {
    const result = await client.query(`
        SELECT *
        FROM payments
        WHERE id = $1
    `, [id]);

    return result.rows[0];
}

async function findPaymentByOrderId(orderId) {
    const result = await pool.query(
        `
        SELECT *
        FROM payments
        WHERE order_id = $1
        ORDER BY created_at DESC
        `,
        [orderId]
    );

    return result.rows;
}

async function findPaymentByCheckoutSessionId(
    provider,
    checkoutSessionId
) {
    const result = await pool.query(
        `
        SELECT *
        FROM payments
        WHERE provider = $1
          AND provider_checkout_session_id = $2
        `,
        [provider, checkoutSessionId]
    );

    return result.rows[0];
}

async function findPaymentByPaymentIntentId(
    provider,
    paymentIntentId
) {
    const result = await pool.query(
        `
        SELECT *
        FROM payments
        WHERE provider = $1
          AND provider_payment_intent_id = $2
        `,
        [provider, paymentIntentId]
    );

    return result.rows[0];
}

async function updateStripeCheckoutSession(
    client,
    paymentId,
    checkoutSessionId
) {
    const result = await client.query(
        `
        UPDATE payments
        SET provider_checkout_session_id = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [paymentId, checkoutSessionId]
    );

    return result.rows[0];
}

async function updateStripePaymentIntent(
    client,
    paymentId,
    paymentIntentId
) {
    const result = await client.query(`
        UPDATE payments
        SET
            provider_payment_intent_id = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `, [paymentId, paymentIntentId]);

    return result.rows[0];
}

async function updatePaymentStatus(
    client,
    paymentId,
    status,
    failureCode = null,
    failureMessage = null
) {
    const result = await client.query(
        `
        UPDATE payments
        SET status = $2,
            failure_code = $3,
            failure_message = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [
            paymentId,
            status,
            failureCode,
            failureMessage
        ]
    );

    return result.rows[0];
}

async function updatePaymentFailureDetails(
    client,
    paymentId,
    failureCode = null,
    failureMessage = null
) {
    const result = await client.query(
        `
        UPDATE payments
        SET
            failure_code = $2,
            failure_message = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [paymentId, failureCode, failureMessage]
    );

    return result.rows[0];
}

async function createWebhookEvent(
    client,
    provider,
    providerEventId,
    eventType
) {
    const result = await client.query(
        `
        INSERT INTO payment_webhook_events (
            provider,
            provider_event_id,
            event_type
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (provider, provider_event_id)
        DO NOTHING
        RETURNING *
        `,
        [
            provider,
            providerEventId,
            eventType
        ]
    );

    return result.rows[0] || null;
}

async function findWebhookEvent(
    client,
    provider,
    providerEventId,
    forUpdate = false
) {
    const result = await client.query(
        `
        SELECT *
        FROM payment_webhook_events
        WHERE provider = $1
          AND provider_event_id = $2
        ${forUpdate ? "FOR UPDATE" : ""}
        `,
        [
            provider,
            providerEventId
        ]
    );

    return result.rows[0] || null;
}

async function markWebhookEventProcessed(client, eventId) {
    const result = await client.query(
        `
        UPDATE payment_webhook_events
        SET processed_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [eventId]
    );

    return result.rows[0];
}

module.exports = {
    createPayment,
    findPaymentById,
    findPaymentByOrderId,
    findPaymentByCheckoutSessionId,
    findPaymentByPaymentIntentId,
    updateStripeCheckoutSession,
    updateStripePaymentIntent,
    updatePaymentStatus,
    updatePaymentFailureDetails,
    createWebhookEvent,
    findWebhookEvent,
    markWebhookEventProcessed
};
