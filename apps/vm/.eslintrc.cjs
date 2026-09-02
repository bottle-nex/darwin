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
                    "REDIS_URL",
                    "VM_E2B_API_KEY",
                    "VM_SANDBOX_TEMPLATE",
                    "VM_PRODUCT_DIFF_CONCURRENCY",
                    "VM_PREVIEW_MODEL",
                    "VM_PREVIEW_EFFORT",
                    "ROUTER_ANTHROPIC_API_KEY",
                    "VM_BRIEF_MODEL",
                    "VM_BRIEF_EFFORT",
                    "SECRET_ENCRYPTION_KEY",
                    "GITHUB_APP_ID",
                    "GITHUB_APP_CLIENT_ID",
                    "GITHUB_APP_CLIENT_SECRET",
                    "GITHUB_APP_PRIVATE_KEY",
                ],
            },
        ],
    },
};
