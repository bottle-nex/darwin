import chalk from "chalk";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: new URL("../../../../.env", import.meta.url).pathname });

const envSchema = z.object({
    SERVER_PORT: z
        .string()
        .default("8080")
        .transform((val) => parseInt(val, 10)),
    SERVER_NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    JWT_SECRET: z.string().min(32),
    SECRET_ENCRYPTION_KEY: z
        .string()
        .regex(/^[0-9a-fA-F]{64}$/, "Must be a 64-character hex string (32 bytes for AES-256)"),
    SERVER_JWT_TOKEN_TTL: z.string().default("7d"),
    SERVER_SANDBOX_JWT_TTL: z.string().default("20m"),
    WORKER_JWT_TTL: z.string().default("90m"),
    REDIS_URL: z.url("Invalid Redis URL"),
    INVITATION_URL_TTL_DAYS: z.coerce.number().default(7),
    SERVER_OTP_TTL_SECONDS: z.coerce.number().default(600),
    SERVER_OTP_COOLDOWN_SECONDS: z.coerce.number().default(60),
    SERVER_OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
    SERVER_RESEND_API_KEY: z.string().min(1, "Resend api key is required"),
    SERVER_EMAIL_FROM: z.string().min(1).default("matcha <noreply@highgarden.app>"),
    SERVER_WEB_URL: z.url({ protocol: /^https?$/ }),
    PUBLIC_API_URL: z.url({ protocol: /^https?$/ }),
    SERVER_ADMIN_URL: z.url({ protocol: /^https?$/ }).default("http://localhost:4401"),
    SERVER_ADMIN_EMAILS: z
        .string()
        .default("")
        .transform((val) =>
            val
                .split(",")
                .map((entry) => entry.trim().toLowerCase())
                .filter(Boolean),
        ),
    SERVER_ADMIN_JWT_TTL: z.string().default("12h"),
    REVALIDATE_SECRET: z.string().optional(),
    SERVER_GCS_PROJECT_ID: z.string().optional(),
    SERVER_GCS_BUCKET: z.string().optional(),
    SERVER_GCS_CLIENT_EMAIL: z.string().optional(),
    SERVER_GCS_PRIVATE_KEY: z.string().optional(),
    SERVER_GCS_PUBLIC_URL: z.string().optional(),
    PRODUCT_DIFF_BUCKET: z.string().optional(),
    RUN_LOGS_BUCKET: z.string().optional(),
    MINIO_URL: z.url({ protocol: /^https?$/ }).optional(),
    MINIO_ACCESS_KEY: z.string().optional(),
    MINIO_SECRET_KEY: z.string().optional(),
    DATABASE_URL: z.string().min(1, "Database URL is required"),
    GITHUB_APP_ID: z.string().min(1, "GitHub App ID is required"),
    SERVER_GITHUB_APP_SLUG: z.string().min(1, "GitHub App slug is required"),
    GITHUB_APP_CLIENT_ID: z.string().min(1, "GitHub App client id is required"),
    GITHUB_APP_CLIENT_SECRET: z.string().min(1, "GitHub App client secret is required"),
    GITHUB_APP_PRIVATE_KEY: z
        .string()
        .min(1, "GitHub App private key (base64-encoded PEM) is required"),
    SERVER_GITHUB_APP_WEBHOOK_SECRET: z.string().min(1, "GitHub App webhook secret is required"),
    SERVER_OPENROUTER_API_KEY: z.string().min(1, "Open router API key is required"),
    SLACK_CLIENT_ID: z.string().optional(),
    SLACK_CLIENT_SECRET: z.string().optional(),
    SLACK_SIGNING_SECRET: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_BOT_USERNAME: z.string().optional(),
    TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
    SERVER_AGENT_QUESTION_TTL_SECONDS: z.coerce.number().default(86400),
    SERVER_CONNECTOR_LINK_TTL_SECONDS: z.coerce.number().default(600),
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
export const isDevelopment = () => ENV.SERVER_NODE_ENV === "development";
export const isProduction = () => ENV.SERVER_NODE_ENV === "production";
