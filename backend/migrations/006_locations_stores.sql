/*
 * DeMart - Locations, Stores and Store Inventory
 *
 * Supports:
 * - Customer location selection
 * - Multiple branches within a location
 * - Branch-specific working hours
 * - Branch-specific product inventory
 * - Future scheduled-delivery availability
 */

BEGIN;


/*
 * ---------------------------------------------------------
 * LOCATIONS
 * ---------------------------------------------------------
 *
 * Represents the geographical location hierarchy used by
 * the customer to find eligible stores.
 *
 * Example:
 * Germany -> Baden-Württemberg -> Stuttgart
 */

CREATE TABLE IF NOT EXISTS locations (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    country character varying(100) NOT NULL,
    region character varying(100) NOT NULL,
    city character varying(100) NOT NULL,

    timezone character varying(100) NOT NULL,

    is_active boolean NOT NULL DEFAULT true,

    created_at timestamp without time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT locations_unique_location
        UNIQUE (country, region, city)
);


/*
 * ---------------------------------------------------------
 * STORES / BRANCHES
 * ---------------------------------------------------------
 *
 * A location can contain multiple stores/branches.
 *
 * Example:
 * Stuttgart
 *   - DeMart Stuttgart Mitte
 *   - DeMart Stuttgart Vaihingen
 *   - DeMart Stuttgart Bad Cannstatt
 */

CREATE TABLE IF NOT EXISTS stores (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    location_id integer NOT NULL,

    name character varying(150) NOT NULL,

    address text NOT NULL,

    timezone character varying(100) NOT NULL,

    is_active boolean NOT NULL DEFAULT true,

    created_at timestamp without time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT stores_location_id_fkey
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT stores_location_name_unique
        UNIQUE (location_id, name)
);


/*
 * ---------------------------------------------------------
 * STORE WORKING HOURS
 * ---------------------------------------------------------
 *
 * day_of_week:
 *
 * 0 = Sunday
 * 1 = Monday
 * 2 = Tuesday
 * 3 = Wednesday
 * 4 = Thursday
 * 5 = Friday
 * 6 = Saturday
 *
 * A closed day is represented by is_closed = true.
 */

CREATE TABLE IF NOT EXISTS store_working_hours (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    store_id integer NOT NULL,

    day_of_week integer NOT NULL,

    opens_at time without time zone,

    closes_at time without time zone,

    is_closed boolean NOT NULL DEFAULT false,

    CONSTRAINT store_working_hours_store_id_fkey
        FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE,

    CONSTRAINT store_working_hours_day_unique
        UNIQUE (store_id, day_of_week),

    CONSTRAINT store_working_hours_day_check
        CHECK (day_of_week BETWEEN 0 AND 6),

    CONSTRAINT store_working_hours_time_check
        CHECK (
            (
                is_closed = true
                AND opens_at IS NULL
                AND closes_at IS NULL
            )
            OR
            (
                is_closed = false
                AND opens_at IS NOT NULL
                AND closes_at IS NOT NULL
                AND opens_at < closes_at
            )
        )
);


/*
 * ---------------------------------------------------------
 * PRODUCT STORE INVENTORY
 * ---------------------------------------------------------
 *
 * Stores inventory independently for every branch.
 *
 * A product can therefore have different quantities at
 * different stores.
 *
 * Example:
 *
 * Laptop
 *   Stuttgart Mitte       -> 12
 *   Stuttgart Vaihingen   -> 3
 *   Stuttgart Bad Cannstatt -> 0
 */

CREATE TABLE IF NOT EXISTS product_store_inventory (
    product_id integer NOT NULL,

    store_id integer NOT NULL,

    available_quantity integer NOT NULL DEFAULT 0,

    reserved_quantity integer NOT NULL DEFAULT 0,

    updated_at timestamp without time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (product_id, store_id),

    CONSTRAINT product_store_inventory_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT product_store_inventory_store_id_fkey
        FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE,

    CONSTRAINT product_store_inventory_available_check
        CHECK (available_quantity >= 0),

    CONSTRAINT product_store_inventory_reserved_check
        CHECK (reserved_quantity >= 0)
);


/*
 * ---------------------------------------------------------
 * INDEXES
 * ---------------------------------------------------------
 */

CREATE INDEX IF NOT EXISTS locations_country_region_city_idx
    ON locations(country, region, city);

CREATE INDEX IF NOT EXISTS stores_location_id_idx
    ON stores(location_id);

CREATE INDEX IF NOT EXISTS stores_active_idx
    ON stores(is_active);

CREATE INDEX IF NOT EXISTS store_working_hours_store_id_idx
    ON store_working_hours(store_id);

CREATE INDEX IF NOT EXISTS product_store_inventory_store_id_idx
    ON product_store_inventory(store_id);


/*
 * ---------------------------------------------------------
 * SEED LOCATION
 * ---------------------------------------------------------
 */

INSERT INTO locations (
    country,
    region,
    city,
    timezone
)
VALUES (
    'Germany',
    'Baden-Württemberg',
    'Stuttgart',
    'Europe/Berlin'
)
ON CONFLICT (country, region, city)
DO NOTHING;


/*
 * ---------------------------------------------------------
 * SEED STORES / BRANCHES
 * ---------------------------------------------------------
 */

INSERT INTO stores (
    location_id,
    name,
    address,
    timezone
)
SELECT
    id,
    'DeMart Stuttgart Mitte',
    'Example Street 1, 70173 Stuttgart',
    'Europe/Berlin'
FROM locations
WHERE
    country = 'Germany'
    AND region = 'Baden-Württemberg'
    AND city = 'Stuttgart'
ON CONFLICT (location_id, name)
DO NOTHING;


INSERT INTO stores (
    location_id,
    name,
    address,
    timezone
)
SELECT
    id,
    'DeMart Stuttgart Vaihingen',
    'Example Street 2, 70563 Stuttgart',
    'Europe/Berlin'
FROM locations
WHERE
    country = 'Germany'
    AND region = 'Baden-Württemberg'
    AND city = 'Stuttgart'
ON CONFLICT (location_id, name)
DO NOTHING;


INSERT INTO stores (
    location_id,
    name,
    address,
    timezone
)
SELECT
    id,
    'DeMart Stuttgart Bad Cannstatt',
    'Example Street 3, 70372 Stuttgart',
    'Europe/Berlin'
FROM locations
WHERE
    country = 'Germany'
    AND region = 'Baden-Württemberg'
    AND city = 'Stuttgart'
ON CONFLICT (location_id, name)
DO NOTHING;


/*
 * ---------------------------------------------------------
 * SEED WORKING HOURS
 * ---------------------------------------------------------
 *
 * Monday-Friday: 09:00-20:00
 * Saturday:      09:00-18:00
 * Sunday:        Closed
 */

INSERT INTO store_working_hours (
    store_id,
    day_of_week,
    opens_at,
    closes_at,
    is_closed
)
SELECT
    s.id,
    d.day_of_week,
    CASE
        WHEN d.day_of_week = 6 THEN TIME '09:00'
        ELSE TIME '09:00'
    END,
    CASE
        WHEN d.day_of_week = 6 THEN TIME '18:00'
        ELSE TIME '20:00'
    END,
    false
FROM stores s
CROSS JOIN (
    VALUES
        (1),
        (2),
        (3),
        (4),
        (5),
        (6)
) AS d(day_of_week)
WHERE s.name IN (
    'DeMart Stuttgart Mitte',
    'DeMart Stuttgart Vaihingen',
    'DeMart Stuttgart Bad Cannstatt'
)
ON CONFLICT (store_id, day_of_week)
DO NOTHING;


INSERT INTO store_working_hours (
    store_id,
    day_of_week,
    opens_at,
    closes_at,
    is_closed
)
SELECT
    s.id,
    0,
    NULL,
    NULL,
    true
FROM stores s
WHERE s.name IN (
    'DeMart Stuttgart Mitte',
    'DeMart Stuttgart Vaihingen',
    'DeMart Stuttgart Bad Cannstatt'
)
ON CONFLICT (store_id, day_of_week)
DO NOTHING;


COMMIT;