const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/db");
require("dotenv").config();

async function registerUser(name, email, password) {

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, created_at`,
        [name, email, passwordHash]
    );

    return result.rows[0];
}

async function loginUser(email, password) {

    const result = await pool.query(
        `SELECT id, name, email, password_hash, created_at
         FROM users
         WHERE email = $1`,
        [email]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatch) {
    return null;
}

const token = jwt.sign(
    {
        id: user.id,
        email: user.email
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "1h"
    }
);

return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at,
    token: token
};
}

async function getUserById(userId) {

    const result = await pool.query(
        `
        SELECT id, name, email, created_at
        FROM users
        WHERE id = $1
        `,
        [userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

module.exports = {
    registerUser,
    loginUser,
    getUserById
};