/** @type {import("eslint").Linter.Config} */
module.exports = {
    root: true,
    extends: ["@trymatcha/eslint-config/library.js"],
    ignorePatterns: ["*.d.ts"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: true,
    },
    globals: {
        Bun: "readonly",
    },
    rules: {
        "turbo/no-undeclared-env-vars": [
            "error",
            {
                allowList: [
                    "NODE_ENV",
                    "PORT",
                    "DATABASE_URL",
                    "SERVER_REDIS_URL",
                    "SERVER_E2B_API_KEY",
                    "SERVER_SANDBOX_TEMPLATE",
                    "SERVER_PRODUCT_DIFF_CONCURRENCY",
                    "SERVER_PREVIEW_MODEL",
                    "SERVER_PREVIEW_EFFORT",
                    "SERVER_ANTHROPIC_API_KEY",
                    "SERVER_BRIEF_MODEL",
                    "SERVER_BRIEF_EFFORT",
                    "SERVER_SECRET_ENCRYPTION_KEY",
                    "SERVER_GITHUB_APP_ID",
                    "SERVER_GITHUB_APP_CLIENT_ID",
                    "SERVER_GITHUB_APP_CLIENT_SECRET",
                    "SERVER_GITHUB_APP_PRIVATE_KEY",
                ],
            },
        ],
    },
};
