const fs = require("fs");
const path = require("path");

const pool = require("./db");

const MIGRATIONS_DIR = path.join(__dirname, "../../migrations");

async function ensureMigrationTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id integer PRIMARY KEY,
            filename varchar(255) NOT NULL UNIQUE,
            applied_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

function getMigrationFiles() {
    return fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((file) => /^\d+_.+\.sql$/.test(file))
        .sort();
}

async function getAppliedMigrations(client) {
    const result = await client.query(`
        SELECT id, filename
        FROM schema_migrations
        ORDER BY id
    `);

    return new Map(
        result.rows.map((row) => [row.id, row.filename])
    );
}

async function markBaseline(client, migrationFile) {
    const migrationId = Number(migrationFile.match(/^(\d+)_/)[1]);

    const tablesResult = await client.query(`
        SELECT COUNT(*)::int AS count
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('users', 'products', 'orders', 'order_items')
    `);

    const tableCount = tablesResult.rows[0].count;

    if (migrationId === 1 && tableCount === 4) {
        await client.query(
            `
            INSERT INTO schema_migrations (id, filename)
            VALUES ($1, $2)
            ON CONFLICT (id) DO NOTHING
            `,
            [migrationId, migrationFile]
        );

        console.log(`Baseline recorded: ${migrationFile}`);
        return true;
    }

    return false;
}

async function runMigrations() {
    const client = await pool.connect();

    try {
        await ensureMigrationTable(client);

        const migrationFiles = getMigrationFiles();

        if (migrationFiles.length === 0) {
            console.log("No migration files found.");
            return;
        }

        let appliedMigrations = await getAppliedMigrations(client);

        for (const migrationFile of migrationFiles) {
            const migrationId = Number(
                migrationFile.match(/^(\d+)_/)[1]
            );

            if (appliedMigrations.has(migrationId)) {
                console.log(`Already applied: ${migrationFile}`);
                continue;
            }

            const baselineRecorded = await markBaseline(
                client,
                migrationFile
            );

            if (baselineRecorded) {
                appliedMigrations.set(migrationId, migrationFile);
                continue;
            }

            const migrationPath = path.join(
                MIGRATIONS_DIR,
                migrationFile
            );

            const sql = fs.readFileSync(migrationPath, "utf8");

            console.log(`Applying migration: ${migrationFile}`);

            await client.query("BEGIN");

            try {
                await client.query(sql);

                await client.query(
                    `
                    INSERT INTO schema_migrations (id, filename)
                    VALUES ($1, $2)
                    `,
                    [migrationId, migrationFile]
                );

                await client.query("COMMIT");

                console.log(`Applied: ${migrationFile}`);
                appliedMigrations.set(migrationId, migrationFile);
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            }
        }

        console.log("Database migrations complete.");
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
