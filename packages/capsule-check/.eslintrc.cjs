/** @type {import("eslint").Linter.Config} */
module.exports = {
    root: true,
    extends: ["@trymatcha/eslint-config/library.js"],
    ignorePatterns: ["dist", "*.d.ts"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: true,
    },
    env: {
        browser: true,
    },
    globals: {
        Bun: "readonly",
    },
};
