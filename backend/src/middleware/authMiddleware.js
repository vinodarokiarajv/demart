const jwt = require("jsonwebtoken");

const pool = require("../db/db");

require("dotenv").config();

async function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const result = await pool.query(
            `
            SELECT
                id,
                email,
                role,
                account_status
            FROM users
            WHERE id = $1
            `,
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "User account not found"
            });
        }

        const user = result.rows[0];

        if (user.account_status !== "ACTIVE") {
            return res.status(401).json({
                message: "Account is no longer active"
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        next();

    } catch (error) {

        console.error("Authentication error:", error);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = authMiddleware;