import dotenv from "dotenv";
import { z } from "zod";
import chalk from "chalk";

dotenv.config({ path: new URL("../../../../.env", import.meta.url).pathname });

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "Database URL is required"),
    SERVER_REDIS_URL: z.url("Invalid Redis URL"),
    SERVER_E2B_API_KEY: z.string().nonempty(),
    SERVER_SANDBOX_TEMPLATE: z.string().min(1).default("node-py-claude-template"),
    SERVER_CLAUDE_CODE_OAUTH_TOKEN: z.string().min(1, "Claude Code OAuth token is required"),
    SERVER_BRIEF_MODEL: z.string().default("claude-sonnet-5"),
    SERVER_BRIEF_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("low"),
    SERVER_SOLVE_MODEL: z.string().default("claude-sonnet-5"),
    SERVER_SOLVE_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("high"),
    SERVER_VM_DISPATCH_CONCURRENCY: z.coerce.number().int().min(1).default(10),
    SERVER_PRODUCT_DIFF_CONCURRENCY: z.coerce.number().int().min(1).default(2),
    SERVER_PREVIEW_MODEL: z.string().default("claude-sonnet-5"),
    SERVER_PREVIEW_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("high"),
    SERVER_SECRET_ENCRYPTION_KEY: z
        .string()
        .regex(/^[0-9a-fA-F]{64}$/, "Must be a 64-character hex string (32 bytes for AES-256)"),
    SERVER_GITHUB_APP_ID: z.string().min(1, "GitHub App ID is required"),
    SERVER_GITHUB_APP_CLIENT_ID: z.string().min(1, "GitHub App client id is required"),
    SERVER_GITHUB_APP_CLIENT_SECRET: z.string().min(1, "GitHub App client secret is required"),
    SERVER_GITHUB_APP_PRIVATE_KEY: z
        .string()
        .min(1, "GitHub App private key (base64-encoded PEM) is required"),
    SERVER_JWT_SECRET: z.string().min(32),
    SERVER_WORKER_JWT_TTL: z.string().default("90m"),
    SERVER_PUBLIC_API_URL: z
        .string()
        .min(1, "Public API URL is required — the sandbox calls back to this"),
    SERVER_PRODUCT_DIFF_BUCKET: z.string().optional(),
    SERVER_MINIO_URL: z.url({ protocol: /^https?$/ }).optional(),
    SERVER_MINIO_ACCESS_KEY: z.string().optional(),
    SERVER_MINIO_SECRET_KEY: z.string().optional(),
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
