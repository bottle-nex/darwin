import { config } from "dotenv";
import { dirname, resolve } from "path";
import { defineConfig, env } from "prisma/config";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
    schema: "prisma/schema",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: env("DATABASE_URL"),
    },
});
