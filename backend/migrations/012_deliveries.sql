CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,

    order_id INTEGER NOT NULL UNIQUE
        REFERENCES orders(id)
        ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',

    assigned_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    out_for_delivery_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT deliveries_status_valid
        CHECK (
            status IN (
                'CREATED',
                'ASSIGNED',
                'PICKED_UP',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'CANCELLED'
            )
        )
);