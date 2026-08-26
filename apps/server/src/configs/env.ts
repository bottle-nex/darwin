import { isIP } from "node:net";

import chalk from "chalk";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: new URL("../../../../.env", import.meta.url).pathname });

const envSchema = z
    .object({
        SERVER_PORT: z
            .string()
            .default("8080")
            .transform((val) => parseInt(val, 10)),
        SERVER_NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
        SERVER_JWT_SECRET: z.string().min(32),
        SERVER_SECRET_ENCRYPTION_KEY: z
            .string()
            .regex(/^[0-9a-fA-F]{64}$/, "Must be a 64-character hex string (32 bytes for AES-256)"),
        SERVER_JWT_TOKEN_TTL: z.string().default("7d"),
        SERVER_SANDBOX_JWT_TTL: z.string().default("20m"),
        SERVER_WORKER_JWT_TTL: z.string().default("90m"),
        SERVER_REDIS_URL: z.url("Invalid Redis URL"),
        INVITATION_URL_TTL_DAYS: z.coerce.number().default(7),
        SERVER_OTP_TTL_SECONDS: z.coerce.number().default(600),
        SERVER_OTP_COOLDOWN_SECONDS: z.coerce.number().default(60),
        SERVER_OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
        SERVER_RESEND_API_KEY: z.string().min(1, "Resend api key is required"),
        SERVER_EMAIL_FROM: z.string().min(1).default("matcha <noreply@highgarden.app>"),
        SERVER_WEB_URL: z.url({ protocol: /^https?$/ }),
        SERVER_PUBLIC_API_URL: z.url({ protocol: /^https?$/ }),
        SERVER_ADMIN_URL: z.url({ protocol: /^https?$/ }).default("http://localhost:5174"),
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
        SERVER_PRODUCT_DIFF_BUCKET: z.string().optional(),
        SERVER_MINIO_URL: z.url({ protocol: /^https?$/ }).optional(),
        SERVER_MINIO_ACCESS_KEY: z.string().optional(),
        SERVER_MINIO_SECRET_KEY: z.string().optional(),
        SERVER_PRODUCT_DIFF_REPLAY_ENABLED: z
            .enum(["true", "false"])
            .default("false")
            .transform((value) => value === "true"),
        SERVER_PRODUCT_DIFF_REPLAY_ORIGIN: z
            .url({ protocol: /^https?$/ })
            .refine((value) => {
                const url = new URL(value);
                return (
                    url.pathname === "/" &&
                    url.search === "" &&
                    url.hash === "" &&
                    url.username === "" &&
                    url.password === ""
                );
            }, "Replay origin must contain only an HTTP(S) origin")
            .optional(),
        DATABASE_URL: z.string().min(1, "Database URL is required"),
        SERVER_GITHUB_APP_ID: z.string().min(1, "GitHub App ID is required"),
        SERVER_GITHUB_APP_SLUG: z.string().min(1, "GitHub App slug is required"),
        SERVER_GITHUB_APP_CLIENT_ID: z.string().min(1, "GitHub App client id is required"),
        SERVER_GITHUB_APP_CLIENT_SECRET: z.string().min(1, "GitHub App client secret is required"),
        SERVER_GITHUB_APP_PRIVATE_KEY: z
            .string()
            .min(1, "GitHub App private key (base64-encoded PEM) is required"),
        SERVER_GITHUB_APP_WEBHOOK_SECRET: z.string().optional(),
        OPENROUTER_API_KEY: z.string().min(1, "Open router API key is required"),
    })
    .superRefine((environment, context) => {
        if (!environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED) return;
        if (!environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN) {
            context.addIssue({
                code: "custom",
                path: ["SERVER_PRODUCT_DIFF_REPLAY_ORIGIN"],
                message: "Replay origin is required when Product Diff replay is enabled",
            });
            return;
        }

        const replay_origin = new URL(environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN);
        if (environment.SERVER_NODE_ENV !== "development" && replay_origin.protocol !== "https:") {
            context.addIssue({
                code: "custom",
                path: ["SERVER_PRODUCT_DIFF_REPLAY_ORIGIN"],
                message: "Replay origin must use HTTPS outside local development",
            });
        }

        const ordinary_origins = [
            environment.SERVER_WEB_URL,
            environment.SERVER_PUBLIC_API_URL,
            environment.SERVER_ADMIN_URL,
        ].map((value) => new URL(value));
        const local_development =
            environment.SERVER_NODE_ENV === "development" &&
            local_hostname(replay_origin.hostname) &&
            ordinary_origins.every((origin) => local_hostname(origin.hostname));
        if (replay_origin.protocol !== "https:" && !local_development) {
            context.addIssue({
                code: "custom",
                path: ["SERVER_PRODUCT_DIFF_REPLAY_ORIGIN"],
                message: "HTTP replay origins are limited to local development",
            });
        }
        if (
            !local_development &&
            (isIP(replay_origin.hostname) !== 0 || !replay_origin.hostname.includes("."))
        ) {
            context.addIssue({
                code: "custom",
                path: ["SERVER_PRODUCT_DIFF_REPLAY_ORIGIN"],
                message: "Replay origin must have a separately registrable site",
            });
        }
        if (
            !local_development &&
            ordinary_origins.some(
                (origin) =>
                    site_boundary(origin.hostname) === site_boundary(replay_origin.hostname),
            )
        ) {
            context.addIssue({
                code: "custom",
                path: ["SERVER_PRODUCT_DIFF_REPLAY_ORIGIN"],
                message: "Replay origin must use a site separate from Matcha applications",
            });
        }
    });

function local_hostname(hostname: string): boolean {
    const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return (
        normalized === "localhost" ||
        normalized.endsWith(".localhost") ||
        normalized === "::1" ||
        /^127(?:\.\d{1,3}){3}$/.test(normalized)
    );
}

function site_boundary(hostname: string): string {
    const labels = hostname.toLowerCase().replace(/\.$/, "").split(".");
    return labels.length < 2 ? labels[0]! : labels.slice(-2).join(".");
}

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
