import { readFileSync } from "node:fs";

import Logger from "@trydarwin/logger";
import { defaultBuildLogger, Template } from "e2b";

import { ENV } from "../conf/config.env";

const log = Logger.scope("template");

/**
 * Builds the E2B sandbox template every runner boots from.
 *
 * This exists because `docker/e2b.Dockerfile` was previously built out of band, which let the
 * live template drift away from it: sandboxes were running without `gh` and without the
 * sandbox-mcp bundle, so the solving agent could neither open a PR nor report one. Keeping the
 * build in the repo is what stops that drift happening again.
 *
 * Run with: bun run template
 *
 * Prerequisite: `packages/sandbox-mcp/dist/index.js` and `packages/capsule-check/dist/index.js`
 * must be current, since the Dockerfile copies them in — build them first with
 * `bun run build --filter=@trydarwin/sandbox-mcp --filter=@trydarwin/capsule-check`.
 */

const TEMPLATE_NAME = "node-py-claude-template";
const TEMPLATE_TAG = "stable";
// E2B's default is 976 MB, of which roughly 700 MB is free once the box has booted. Installing a
// real project's dependencies and then bundling six components with vite wants more than that.
// Raising this is what makes Product Diff able to build a customer's app at all.
const SANDBOX_MEMORY_MB = 4096;
const SANDBOX_CPU_COUNT = 4;
const REPO_ROOT = new URL("../../../../", import.meta.url).pathname;
const DOCKERFILE = `${REPO_ROOT}docker/e2b.Dockerfile`;
const BUNDLES: { name: string; path: string; filter: string }[] = [
    {
        name: "sandbox-mcp",
        path: `${REPO_ROOT}packages/sandbox-mcp/dist/index.js`,
        filter: "@trydarwin/sandbox-mcp",
    },
    {
        name: "capsule-check",
        path: `${REPO_ROOT}packages/capsule-check/dist/index.js`,
        filter: "@trydarwin/capsule-check",
    },
];

async function main() {
    for (const bundle of BUNDLES) {
        try {
            readFileSync(bundle.path);
        } catch {
            log.error(
                `${bundle.name} bundle is missing — build it before building the template`,
                undefined,
                { expected: bundle.path, build_with: `bun run build --filter=${bundle.filter}` },
            );
            process.exit(1);
        }
    }

    const dockerfile = readFileSync(DOCKERFILE, "utf8");
    log.step("building sandbox template", { name: TEMPLATE_NAME, dockerfile: DOCKERFILE });

    const template = Template({
        fileContextPath: REPO_ROOT,
        fileIgnorePatterns: [".git", "node_modules", ".next", ".turbo", "dist/**/*.map"],
    }).fromDockerfile(dockerfile);

    await Template.build(template, TEMPLATE_NAME, {
        apiKey: ENV.VM_E2B_API_KEY,
        tags: [TEMPLATE_TAG],
        memoryMB: SANDBOX_MEMORY_MB,
        cpuCount: SANDBOX_CPU_COUNT,
        onBuildLogs: defaultBuildLogger(),
    });

    log.success("template built", { name: `${TEMPLATE_NAME}:${TEMPLATE_TAG}` });
    log.info("verify with: bun run src/scripts/script.verify_sandbox_template.ts");
}

main().catch((error) => {
    log.error("template build failed", error);
    process.exit(1);
});
