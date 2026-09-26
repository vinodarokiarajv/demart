BEGIN;


/*
 * ---------------------------------------------------------
 * DEFAULT BRANCH INVENTORY
 * ---------------------------------------------------------
 *
 * Distribute every active product across the three
 * Stuttgart branches.
 *
 * Approximate distribution:
 *
 * Stuttgart Mitte       -> 50%
 * Stuttgart Vaihingen   -> 30%
 * Stuttgart Bad Cannstatt -> remainder
 *
 * The three quantities always add up to the existing
 * products.stock_quantity.
 */

INSERT INTO product_store_inventory (
    product_id,
    store_id,
    available_quantity,
    reserved_quantity
)
SELECT
    p.id,
    s.id,

    CASE
        WHEN s.name = 'DeMart Stuttgart Mitte'
            THEN FLOOR(p.stock_quantity * 0.50)::integer

        WHEN s.name = 'DeMart Stuttgart Vaihingen'
            THEN FLOOR(p.stock_quantity * 0.30)::integer

        WHEN s.name = 'DeMart Stuttgart Bad Cannstatt'
            THEN
                p.stock_quantity
                - FLOOR(p.stock_quantity * 0.50)::integer
                - FLOOR(p.stock_quantity * 0.30)::integer
    END,

    0

FROM products p
CROSS JOIN stores s

WHERE
    p.is_active = true
    AND s.is_active = true

ON CONFLICT (product_id, store_id)
DO NOTHING;


/*
 * ---------------------------------------------------------
 * DETERMINISTIC TEST DATA
 * ---------------------------------------------------------
 *
 * These overrides intentionally create different inventory
 * situations between branches for Selenium automation.
 */


/*
 * Product 1
 * DeMart Pro Laptop
 *
 * Mitte       -> 12
 * Vaihingen   -> 2
 * Bad Cannstatt -> 0
 *
 * Total = 14
 */

UPDATE product_store_inventory
SET available_quantity = 12
WHERE
    product_id = 1
    AND store_id = 1;

UPDATE product_store_inventory
SET available_quantity = 2
WHERE
    product_id = 1
    AND store_id = 2;

UPDATE product_store_inventory
SET available_quantity = 0
WHERE
    product_id = 1
    AND store_id = 3;


/*
 * Product 2
 * DeMart Wireless Headphones
 *
 * Mitte       -> 6
 * Vaihingen   -> 4
 * Bad Cannstatt -> 2
 *
 * Total = 12
 */

UPDATE product_store_inventory
SET available_quantity = 6
WHERE
    product_id = 2
    AND store_id = 1;

UPDATE product_store_inventory
SET available_quantity = 4
WHERE
    product_id = 2
    AND store_id = 2;

UPDATE product_store_inventory
SET available_quantity = 2
WHERE
    product_id = 2
    AND store_id = 3;


/*
 * Product 3
 * DeMart Mechanical Keyboard
 *
 * Mitte       -> 13
 * Vaihingen   -> 8
 * Bad Cannstatt -> 4
 *
 * Total = 25
 */

UPDATE product_store_inventory
SET available_quantity = 13
WHERE
    product_id = 3
    AND store_id = 1;

UPDATE product_store_inventory
SET available_quantity = 8
WHERE
    product_id = 3
    AND store_id = 2;

UPDATE product_store_inventory
SET available_quantity = 4
WHERE
    product_id = 3
    AND store_id = 3;


/*
 * Product 4
 * DeMart Smartphone Pro
 *
 * Mitte       -> 4
 * Vaihingen   -> 2
 * Bad Cannstatt -> 1
 *
 * Total = 7
 */

UPDATE product_store_inventory
SET available_quantity = 4
WHERE
    product_id = 4
    AND store_id = 1;

UPDATE product_store_inventory
SET available_quantity = 2
WHERE
    product_id = 4
    AND store_id = 2;

UPDATE product_store_inventory
SET available_quantity = 1
WHERE
    product_id = 4
    AND store_id = 3;


/*
 * Product 5
 * DeMart 4K Monitor
 *
 * Mitte       -> 5
 * Vaihingen   -> 0
 * Bad Cannstatt -> 3
 *
 * Total = 8
 */

UPDATE product_store_inventory
SET available_quantity = 5
WHERE
    product_id = 5
    AND store_id = 1;

UPDATE product_store_inventory
SET available_quantity = 0
WHERE
    product_id = 5
    AND store_id = 2;

UPDATE product_store_inventory
SET available_quantity = 3
WHERE
    product_id = 5
    AND store_id = 3;


/*
 * Product 6
 * DeMart USB-C Hub
 *
 * Mitte       -> 18
 * Vaihingen   -> 10
 * Bad Cannstatt -> 8
 *
 * Total = 36
 */

UPDATE product_store_inventory
SET available_quantity = 18
WHERE
    product_id = 6
    AND store_id = 1;

UPDATE product_store_inventory
SET available_quantity = 10
WHERE
    product_id = 6
    AND store_id = 2;

UPDATE product_store_inventory
SET available_quantity = 8
WHERE
    product_id = 6
    AND store_id = 3;


COMMIT;