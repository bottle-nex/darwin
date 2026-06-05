import dotenv from "dotenv";
import { z } from "zod";
import chalk from "chalk";

dotenv.config({ path: new URL("../../../../.env", import.meta.url).pathname });

const envSchema = z.object({
    SERVER_PORT: z
        .string()
        .default("8080")
        .transform((val) => parseInt(val, 10)),
    SERVER_NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    SERVER_JWT_SECRET: z.string().min(32),
    SERVER_JWT_TOKEN_TTL: z.string().default("7d"),
    SERVER_REDIS_URL: z.url("Invalid Redis URL"),
    INVITATION_URL_TTL_DAYS: z.coerce.number().default(7),
    SERVER_OTP_TTL_SECONDS: z.coerce.number().default(600),
    SERVER_OTP_COOLDOWN_SECONDS: z.coerce.number().default(60),
    SERVER_OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
    SERVER_RESEND_API_KEY: z.string().min(1, "Resend api key is required"),
    SERVER_WEB_URL: z.string().min(1, "Web URL is required"),
    DATABASE_URL: z.string().min(1, "Database URL is required"),
    SERVER_GITHUB_APP_ID: z.string().min(1, "GitHub App ID is required"),
    SERVER_GITHUB_APP_SLUG: z.string().min(1, "GitHub App slug is required"),
    SERVER_GITHUB_APP_CLIENT_ID: z.string().min(1, "GitHub App client id is required"),
    SERVER_GITHUB_APP_CLIENT_SECRET: z.string().min(1, "GitHub App client secret is required"),
    SERVER_GITHUB_APP_PRIVATE_KEY: z
        .string()
        .min(1, "GitHub App private key (base64-encoded PEM) is required"),
    SERVER_GITHUB_APP_WEBHOOK_SECRET: z.string().optional(),
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
