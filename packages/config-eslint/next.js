const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
    extends: [
        "eslint:recommended",
        "prettier",
        require.resolve("@vercel/style-guide/eslint/next"),
        "turbo",
    ],
    globals: {
        React: true,
        JSX: true,
    },
    env: {
        node: true,
    },
    plugins: ["only-warn", "simple-import-sort", "@typescript-eslint", "import"],
    rules: {
        "simple-import-sort/imports": "error",
        "simple-import-sort/exports": "error",
        "@typescript-eslint/consistent-type-imports": "error",
        "import/no-duplicates": "error",
    },
    settings: {
        "import/resolver": {
            typescript: {
                project,
            },
        },
    },
    ignorePatterns: [
        // Ignore dotfiles
        ".*.js",
        "node_modules/",
    ],
    overrides: [{ files: ["*.js?(x)", "*.ts?(x)"] }],
};
