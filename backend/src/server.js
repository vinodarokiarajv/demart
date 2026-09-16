const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");

const pool = require("./db/db");

const app = express();
const PORT = 3000;

app.use(helmet());

const allowedOrigins = (
    process.env.FRONTEND_URL ||
    "http://127.0.0.1:5500,http://localhost:5500"
)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow non-browser requests such as curl/Postman.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(null, false);
        }
    })
);

app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/users", adminUserRoutes);
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
