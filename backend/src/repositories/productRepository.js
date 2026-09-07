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

module.exports = {
    findAllProducts,
    findProductById
};
