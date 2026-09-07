const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const pool = require("./db/db");

const app = express();

const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.get("/api/health", function (req, res) {

    res.json({
        status: "ok",
        message: "DeMart API is running"
    });

});

app.get("/api/db-health", async function (req, res) {

    try {

        const result = await pool.query("SELECT NOW()");

        res.json({
            status: "ok",
            message: "Database connection successful",
            databaseTime: result.rows[0].now
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            status: "error",
            message: "Database connection failed"
        });

    }

});

app.listen(PORT, function () {

    console.log(`DeMart API running on http://localhost:${PORT}`);

});
