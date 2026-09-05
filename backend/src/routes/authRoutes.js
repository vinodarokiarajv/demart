const express = require("express");
const bcrypt = require("bcrypt");

const pool = require("../db/db");

const router = express.Router();

router.post("/register", async function (req, res) {

    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password;

    if (!name || !email || !password) {

        return res.status(400).json({
            message: "Name, email and password are required"
        });

    }

    if (!email.includes("@")) {

        return res.status(400).json({
            message: "Please provide a valid email address"
        });

    }

    if (password.length < 8) {

        return res.status(400).json({
            message: "Password must be at least 8 characters"
        });

    }

    if (!/[A-Z]/.test(password)) {

        return res.status(400).json({
            message: "Password must contain at least one uppercase letter"
        });

    }

    if (!/[a-z]/.test(password)) {

        return res.status(400).json({
            message: "Password must contain at least one lowercase letter"
        });

    }

    if (!/[0-9]/.test(password)) {

        return res.status(400).json({
            message: "Password must contain at least one number"
        });

    }

    if (!/[^A-Za-z0-9]/.test(password)) {

        return res.status(400).json({
            message: "Password must contain at least one special character"
        });

    }

    try {

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, created_at`,
            [name, email, passwordHash]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {

    console.error(error);

    if (error.code === "23505") {

        return res.status(409).json({
            message: "Email address is already registered"
        });

    }

    res.status(500).json({
        message: "Registration failed"
    });

}

});

module.exports = router;
