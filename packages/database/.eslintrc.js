/** @type {import("eslint").Linter.Config} */
module.exports = {
    root: true,
    extends: ["@trymatcha/eslint-config/library.js"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: true,
    },
    ignorePatterns: ["generated/", "dist/", "node_modules/"],
    rules: {
        "turbo/no-undeclared-env-vars": [
            "error",
            {
                allowList: ["NODE_ENV", "DATABASE_URL"],
            },
        ],
    },
};
