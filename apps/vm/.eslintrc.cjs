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
                allowList: ["NODE_ENV", "PORT", "DATABASE_URL"],
            },
        ],
    },
};
