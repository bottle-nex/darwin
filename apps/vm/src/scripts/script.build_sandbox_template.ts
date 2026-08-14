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
 * Prerequisite: `packages/sandbox-mcp/dist/index.js` must be current, since the Dockerfile
 * copies it in — build it first with `bun run build --filter=@trymatcha/sandbox-mcp`.
 */

const TEMPLATE_NAME = "node-py-claude-template";
const REPO_ROOT = new URL("../../../../", import.meta.url).pathname;
const DOCKERFILE = `${REPO_ROOT}docker/e2b.Dockerfile`;
const SANDBOX_MCP_BUNDLE = `${REPO_ROOT}packages/sandbox-mcp/dist/index.js`;

async function main() {
    try {
        readFileSync(SANDBOX_MCP_BUNDLE);
    } catch {
        log.error(
            "sandbox-mcp bundle is missing — build it before building the template",
            undefined,
            { expected: SANDBOX_MCP_BUNDLE },
        );
        process.exit(1);
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
