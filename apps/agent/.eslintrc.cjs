/** @type {import("eslint").Linter.Config} */
module.exports = {
    root: true,
    extends: ["@trymatcha/eslint-config/library.js"],
    ignorePatterns: ["*.d.ts"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: true,
    },
    plugins: ["@typescript-eslint"],
    globals: {
        Bun: "readonly",
    },
    rules: {
        // Core ESLint rules are TypeScript-blind: `no-unused-vars` misfires on enum
        // members and `no-redeclare` on the idiomatic `const` + `type` pair. Use the
        // type-aware equivalents instead.
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
        "no-redeclare": "off",
        "@typescript-eslint/no-redeclare": "error",
        "turbo/no-undeclared-env-vars": [
            "error",
            {
                allowList: ["AGENT_NODE_ENV", "AGENT_PORT", "AGENT_VOYAGE_API_KEY"],
            },
        ],
    },
};
