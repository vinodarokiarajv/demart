const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const pool = require("./db/db");
const config = require("./config");

const app = express();
const PORT = config.port;

app.use(helmet());

const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    "http://127.0.0.1:5500,http://localhost:5500"
)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
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

/*
 * Stripe webhook must receive the raw request body so that
 * Stripe can verify the webhook signature.
 *
 * This route must be registered BEFORE express.json().
 */
app.use("/api/payments", paymentRoutes);

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

app.use(function (error, req, res, next) {
    console.error("Unhandled application error:", error);

    if (error.type === "entity.too.large") {
        return res.status(413).json({
            status: "error",
            message: "Request body is too large"
        });
    }

    return res.status(error.status || 500).json({
        status: "error",
        message: "Internal server error"
    });
});

app.listen(PORT, function () {
    console.log(`DeMart API running on http://localhost:${PORT}`);
});
