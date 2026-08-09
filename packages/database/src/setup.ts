import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/**
 * Post-migration setup for things Prisma can't manage on its own.
 */
async function execute() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

    // A data directory created by one Postgres image carries that image's glibc
    // collation version, so swapping images makes every existing database look
    // stale. template1 matters most: `prisma migrate dev` clones it for the shadow
    // database and refuses to run on a mismatch. All idempotent.
    const { rows } = await pool.query<{ current_database: string }>("SELECT current_database()");
    const database = rows[0]!.current_database;

    await pool.query(`REINDEX DATABASE "${database}"`);
    await pool.query(`ALTER DATABASE "${database}" REFRESH COLLATION VERSION`);
    await pool.query("ALTER DATABASE template1 REFRESH COLLATION VERSION");

    await pool.end();
    console.log(`db setup complete: collation refreshed for ${database} and template1`);
}

execute();
