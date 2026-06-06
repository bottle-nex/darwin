import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function execute() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

    await pool.query("ALTER DATABASE template1 REFRESH COLLATION VERSION");
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    await pool.end();
}
execute();

console.log("pgvector extension enabled");
