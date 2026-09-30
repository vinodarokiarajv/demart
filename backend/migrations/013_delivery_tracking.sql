CREATE TABLE delivery_tracking (
    id SERIAL PRIMARY KEY,

    delivery_id INTEGER NOT NULL
        REFERENCES deliveries(id)
        ON DELETE CASCADE,

    status VARCHAR(30),

    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    note VARCHAR(500),

    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT delivery_tracking_status_valid
        CHECK (
            status IS NULL
            OR status IN (
                'CREATED',
                'ASSIGNED',
                'PICKED_UP',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'CANCELLED'
            )
        ),

    CONSTRAINT delivery_tracking_latitude_check
        CHECK (
            latitude IS NULL
            OR latitude BETWEEN -90 AND 90
        ),

    CONSTRAINT delivery_tracking_longitude_check
        CHECK (
            longitude IS NULL
            OR longitude BETWEEN -180 AND 180
        ),

    CONSTRAINT delivery_tracking_coordinates_pair_check
        CHECK (
            (latitude IS NULL AND longitude IS NULL)
            OR
            (latitude IS NOT NULL AND longitude IS NOT NULL)
        )
);

CREATE INDEX idx_delivery_tracking_delivery_id_recorded_at
    ON delivery_tracking (delivery_id, recorded_at);