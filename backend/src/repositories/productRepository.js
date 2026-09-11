const pool = require("../db/db");

async function findAllProducts() {

    const result = await pool.query(
        `SELECT
            id,
            name,
            category,
            description,
            price,
            rating,
            stock_quantity,
            image_url,
            is_active,
            created_at
         FROM products
         WHERE is_active = true
         ORDER BY id`
    );

    return result.rows;
}

async function findProductById(id) {
    const result = await pool.query(
        `SELECT
            id,
            name,
            category,
            description,
            price,
            rating,
            stock_quantity,
            image_url,
            is_active,
            created_at
         FROM products
         WHERE id = $1
           AND is_active = true`,
        [id]
    );

    return result.rows[0];
}

async function findProductByName(name) {

    const result = await pool.query(
        `SELECT
            id,
            name,
            category,
            description,
            price,
            rating,
            stock_quantity,
            image_url,
            is_active,
            created_at
         FROM products
         WHERE LOWER(name) = LOWER($1)
           AND is_active = true
         LIMIT 1`,
        [name]
    );

    return result.rows[0];
}

async function createProduct(
    name,
    category,
    description,
    price,
    rating,
    stockQuantity,
    imageUrl
) {
    const result = await pool.query(
        `INSERT INTO products
            (name, category, description, price, rating, stock_quantity, image_url)
         VALUES
            ($1, $2, $3, $4, $5, $6, $7)
         RETURNING
            id,
            name,
            category,
            description,
            price,
            rating,
            stock_quantity,
            image_url,
            is_active,
            created_at`,
        [
            name,
            category,
            description,
            price,
            rating,
            stockQuantity,
            imageUrl
        ]
    );

    return result.rows[0];
}

async function updateProduct(
    id,
    name,
    category,
    description,
    price,
    rating,
    stockQuantity,
    imageUrl
) {
    const result = await pool.query(
        `UPDATE products
         SET
            name = $2,
            category = $3,
            description = $4,
            price = $5,
            rating = $6,
            stock_quantity = $7,
            image_url = $8
         WHERE id = $1
           AND is_active = true
         RETURNING
            id,
            name,
            category,
            description,
            price,
            rating,
            stock_quantity,
            image_url,
            is_active,
            created_at`,
        [
            id,
            name,
            category,
            description,
            price,
            rating,
            stockQuantity,
            imageUrl
        ]
    );

    return result.rows[0];
}

async function deleteProduct(id) {

    const result = await pool.query(
        `UPDATE products
         SET is_active = false
         WHERE id = $1
           AND is_active = true
         RETURNING
            id,
            name,
            category,
            description,
            price,
            rating,
            stock_quantity,
            image_url,
            is_active,
            created_at`,
        [id]
    );

    return result.rows[0];
}

async function decreaseStock(client, productId, quantity) {
    const result = await client.query(
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

    return result.rows[0];
}

module.exports = {
    findAllProducts,
    findProductById,
    findProductByName,
    createProduct,
    updateProduct,
    deleteProduct,
    decreaseStock
};
