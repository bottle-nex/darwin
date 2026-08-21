import { readFileSync } from "node:fs";
import { Template, defaultBuildLogger } from "e2b";
import Logger from "@trymatcha/logger";
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
 * Prerequisite: `packages/sandbox-mcp/dist/index.js` and `packages/preview-runner/dist/index.js`
 * must be current, since the Dockerfile copies them in — build them first with
 * `bun run build --filter=@trymatcha/sandbox-mcp --filter=@trymatcha/preview-runner`.
 */

const TEMPLATE_NAME = "node-py-claude-template";
const REPO_ROOT = new URL("../../../../", import.meta.url).pathname;
const DOCKERFILE = `${REPO_ROOT}docker/e2b.Dockerfile`;
const BUNDLES: { name: string; path: string; filter: string }[] = [
    {
        name: "sandbox-mcp",
        path: `${REPO_ROOT}packages/sandbox-mcp/dist/index.js`,
        filter: "@trymatcha/sandbox-mcp",
    },
    {
        name: "preview-runner",
        path: `${REPO_ROOT}packages/preview-runner/dist/index.js`,
        filter: "@trymatcha/preview-runner",
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
        apiKey: ENV.SERVER_E2B_API_KEY,
        onBuildLogs: defaultBuildLogger(),
    });

    log.success("template built", { name: TEMPLATE_NAME });
    log.info("verify with: bun run src/scripts/script.verify_sandbox_template.ts");
}

main().catch((error) => {
    log.error("template build failed", error);
    process.exit(1);
});
