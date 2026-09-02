import dotenv from "dotenv";
import { z } from "zod";
import chalk from "chalk";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const envSchema = z.object({
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    MINIO_URL: z.url({ protocol: /^https?$/ }).optional(),
    MINIO_ACCESS_KEY: z.string().optional(),
    MINIO_SECRET_KEY: z.string().optional(),
    RUN_LOGS_BUCKET: z.string().optional(),
});

function parseEnv() {
    try {
        return envSchema.parse(process.env);
    } catch (err) {
        if (err instanceof z.ZodError) {
            console.error(`\n${chalk.bold("Environment validation failed:")}`);

            err.issues.forEach((issue) => {
                const envVar = issue.path.join(".");

                if (issue.code === "invalid_type") {
                    const received = "received" in issue ? issue.received : "unknown";
                    if (received === "undefined") {
                        console.error(`   ${envVar}: ${chalk.red("not provided")}`);
                    } else {
                        console.error(
                            `   ${envVar}: ${chalk.red(`expected ${issue.expected}, received ${received}`)}`,
                        );
                    }
                } else if (issue.code === "too_small") {
                    console.error(`   ${envVar}: ${chalk.red(issue.message)}`);
                } else {
                    console.error(`   ${envVar}: ${chalk.red(issue.message)}`);
                }
            });

            console.error("\n");
        } else {
            console.error("Environment validation failed:", err);
        }
        process.exit(1);
    }
}

export const ENV = parseEnv();
