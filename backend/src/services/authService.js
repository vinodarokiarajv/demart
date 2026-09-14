const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/db");
require("dotenv").config();

async function registerUser(
    firstName,
    lastName,
    email,
    password,
    street,
    postalCode,
    city,
    country
) {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users
            (
                name,
                first_name,
                last_name,
                email,
                password_hash,
                street,
                postal_code,
                city,
                country
            )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING
            id,
            first_name,
            last_name,
            email,
            street,
            postal_code,
            city,
            country,
            created_at`,
        [
            `${firstName} ${lastName}`,
            firstName,
            lastName,
            email,
            passwordHash,
            street,
            postalCode,
            city,
            country
        ]
    );

    return result.rows[0];
}

async function loginUser(email, password) {

    const result = await pool.query(
        `SELECT
            id,
            name,
            first_name,
            last_name,
            email,
            password_hash,
            street,
            postal_code,
            city,
            country,
            role,
            account_status,
            created_at
         FROM users
         WHERE email = $1`,
        [email]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];

    if (user.account_status !== "ACTIVE") {
    return null;
}

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
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    return {
        id: user.id,
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        street: user.street,
        postal_code: user.postal_code,
        city: user.city,
        country: user.country,
        role: user.role,
        created_at: user.created_at,
        token: token
    };
}

async function getUserById(userId) {

    const result = await pool.query(
        `
        SELECT
    id,
    name,
    first_name,
    last_name,
    email,
    street,
    postal_code,
    city,
    country,
    role,
    account_status,
    created_at
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

async function updateUser(
    userId,
    firstName,
    lastName,
    email,
    street,
    postalCode,
    city,
    country
) {
    const result = await pool.query(
        `
        UPDATE users
        SET
            name = $2,
            first_name = $3,
            last_name = $4,
            email = $5,
            street = $6,
            postal_code = $7,
            city = $8,
            country = $9
        WHERE id = $1
        RETURNING
            id,
            name,
            first_name,
            last_name,
            email,
            street,
            postal_code,
            city,
            country,
            role,
            created_at
        `,
        [
            userId,
            `${firstName} ${lastName}`,
            firstName,
            lastName,
            email,
            street,
            postalCode,
            city,
            country
        ]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    return {
        ...user,
        token: token
    };
}

async function deleteUserAccount(userId) {
    const deletedEmail =
        `deleted-user-${userId}-${Date.now()}@demart.invalid`;

    const result = await pool.query(
        `
        UPDATE users
        SET
            name = 'Deleted User',
            first_name = 'Deleted',
            last_name = 'User',
            email = $1,
            password_hash = $2,
            street = NULL,
            postal_code = NULL,
            city = NULL,
            country = NULL,
            role = 'CUSTOMER',
            account_status = 'DELETED'
        WHERE id = $3
        RETURNING
            id,
            name,
            email,
            role,
            created_at
        `,
        [
            deletedEmail,
            "ACCOUNT_DELETED",
            userId
        ]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

async function updateUserRole(userId, newRole) {
    const result = await pool.query(
        `
        UPDATE users
        SET role = $1
        WHERE id = $2
        RETURNING
            id,
            name,
            first_name,
            last_name,
            email,
            street,
            postal_code,
            city,
            country,
            role,
            created_at
        `,
        [newRole, userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

async function getAdminCount() {
    const result = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE role = 'ADMIN'
        `
    );

    return result.rows[0].count;
}

async function getAllUsers() {
    const result = await pool.query(
        `
        SELECT
            id,
            name,
            first_name,
            last_name,
            email,
            street,
            postal_code,
            city,
            country,
            role,
            created_at
        FROM users
        ORDER BY id
        `
    );

    return result.rows;
}

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    updateUser,
    deleteUserAccount,
    updateUserRole,
    getAdminCount,
    getAllUsers
};