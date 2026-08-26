const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
    extends: ["eslint:recommended", "prettier", "turbo"],
    plugins: ["only-warn", "simple-import-sort", "@typescript-eslint", "import"],
    globals: {
        React: true,
        JSX: true,
    },
    env: {
        node: true,
    },
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
        "dist/",
    ],
    overrides: [
        {
            files: ["*.js?(x)", "*.ts?(x)"],
        },
        {
            files: ["*.ts?(x)"],
            rules: {
                "no-unused-vars": "off",
                "no-dupe-class-members": "off",
                "@typescript-eslint/no-unused-vars": [
                    "error",
                    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
                ],
                "@typescript-eslint/no-dupe-class-members": "error",
            },
        },
    ],
};
