import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/**
 * Post-migration setup for things Prisma can't manage on its own.
 * Run AFTER `prisma migrate deploy` (the code_embeddings table must exist).
 *
 * The `vector` extension itself is handled by Prisma via `extensions = [vector]`
 * in schema.prisma, so it is intentionally not created here.
 */
async function execute() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

    // One-time host fix: silences collation-version warnings introduced by the
    // postgres:16 -> pgvector/pgvector:pg16 image swap. Idempotent.
    await pool.query("ALTER DATABASE template1 REFRESH COLLATION VERSION");

    // The HNSW index can't live in a Prisma migration: Prisma can't represent an
    // index on an Unsupported() column, so `migrate dev` would auto-drop it as drift.
    // Create it here instead, where Prisma's schema-diff never sees it.
    await pool.query(
        `CREATE INDEX IF NOT EXISTS "code_embeddings_embedding_idx" ON code_embeddings USING hnsw (embedding vector_cosine_ops)`,
    );

    await pool.end();
    console.log("db setup complete: collation refreshed, hnsw index ensured");
}

execute();
