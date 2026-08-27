import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        plugins: { "simple-import-sort": simpleImportSort },
        rules: {
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "import/no-duplicates": "error",
            "no-restricted-imports": [
                "error",
                {
                    paths: [
                        {
                            name: "react-icons",
                            message: 'Import icons from "@trymatcha/ui/icons" instead.',
                        },
                    ],
                    patterns: [
                        {
                            group: ["react-icons/*"],
                            message: 'Import icons from "@trymatcha/ui/icons" instead.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: [
            "components/playground/Home/KanbanDisplay/VirtualizedRows.tsx",
            "components/playground/Home/chat/ProjectChatThread.tsx",
            "components/playground/Issue/activity/ActivityFeed.tsx",
        ],
        rules: { "react-hooks/incompatible-library": "off" },
    },
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

export default eslintConfig;
