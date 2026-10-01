const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
    path: path.join(__dirname, "../.env")
});

const requiredVariables = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "JWT_SECRET",
    "STRIPE_SECRET_KEY",
    "GEOAPIFY_API_KEY"
];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(
            `Missing required environment variable: ${variable}`
        );
    }
}

if (process.env.JWT_SECRET.length < 32) {
    throw new Error(
        "JWT_SECRET must be at least 32 characters long"
    );
}

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
        "PORT must be a valid TCP port number"
    );
}

const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:3000";

const aiProvider =
    process.env.AI_PROVIDER || "ollama";

const ollamaBaseUrl =
    process.env.OLLAMA_BASE_URL ||
    "http://localhost:11434";

const ollamaModel =
    process.env.OLLAMA_MODEL ||
    "qwen3.5:9b";

const ollamaThink =
    String(
        process.env.OLLAMA_THINK || "false"
    ).toLowerCase() === "true";

const aiTimeoutMs =
    Number(
        process.env.AI_TIMEOUT_MS || 30000
    );

if (
    !Number.isInteger(aiTimeoutMs) ||
    aiTimeoutMs <= 0
) {
    throw new Error(
        "AI_TIMEOUT_MS must be a positive integer"
    );
}

module.exports = {
    port,
    frontendUrl,
    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    },
    jwtSecret: process.env.JWT_SECRET,
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ""
    },
    geoapify: {
        apiKey: process.env.GEOAPIFY_API_KEY
    },
        ai: {
        provider: aiProvider,
        timeoutMs: aiTimeoutMs,
        ollama: {
            baseUrl: ollamaBaseUrl,
            model: ollamaModel,
            think: ollamaThink
        }
    }
};
