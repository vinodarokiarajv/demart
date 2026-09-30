ALTER TABLE users
    ADD COLUMN latitude numeric(10,7),
    ADD COLUMN longitude numeric(10,7),
    ADD COLUMN geocoded_at timestamp with time zone,
    ADD COLUMN geocode_match_level character varying(20);

ALTER TABLE orders
    ADD COLUMN shipping_latitude numeric(10,7),
    ADD COLUMN shipping_longitude numeric(10,7);

ALTER TABLE users
    ADD CONSTRAINT users_latitude_check
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);

ALTER TABLE users
    ADD CONSTRAINT users_longitude_check
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

ALTER TABLE users
    ADD CONSTRAINT users_geocode_match_level_check
        CHECK (
            geocode_match_level IS NULL
            OR geocode_match_level IN (
                'building',
                'street',
                'area',
                'unresolved'
            )
        );

ALTER TABLE orders
    ADD CONSTRAINT orders_shipping_latitude_check
        CHECK (
            shipping_latitude IS NULL
            OR shipping_latitude BETWEEN -90 AND 90
        );

ALTER TABLE orders
    ADD CONSTRAINT orders_shipping_longitude_check
        CHECK (
            shipping_longitude IS NULL
            OR shipping_longitude BETWEEN -180 AND 180
        );

ALTER TABLE users
    ADD CONSTRAINT users_coordinates_pair_check
        CHECK (
            (latitude IS NULL AND longitude IS NULL)
            OR
            (latitude IS NOT NULL AND longitude IS NOT NULL)
        );

ALTER TABLE orders
    ADD CONSTRAINT orders_shipping_coordinates_pair_check
        CHECK (
            (shipping_latitude IS NULL AND shipping_longitude IS NULL)
            OR
            (shipping_latitude IS NOT NULL AND shipping_longitude IS NOT NULL)
        );