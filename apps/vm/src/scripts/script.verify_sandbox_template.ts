import { Sandbox } from "e2b";
import Logger from "@trymatcha/logger";
import { ENV } from "../conf/config.env";

const log = Logger.scope("template");

/**
 * Boots one throwaway sandbox and asserts every tool the runner flow assumes is actually
 * installed in it.
 *
 * Worth having because the failure it catches is silent and expensive: a template missing
 * `gh` or the sandbox-mcp bundle still boots and still runs claude, so an issue burns a full
 * solve before anyone notices no PR was ever possible. Checking costs one short sandbox.
 *
 * Run with: bun run template:verify
 */

const TEMPLATE_NAME = "node-py-claude-template";
const SANDBOX_MCP_ENTRY = "/opt/matcha/sandbox-mcp/index.js";
const PREVIEW_RUNNER_ENTRY = "/opt/matcha/preview-runner/index.js";

interface Requirement {
    name: string;
    command: string;
    /** Why the runner needs it, printed when it is missing. */
    needed_for: string;
}

const REQUIREMENTS: Requirement[] = [
    { name: "claude", command: "claude --version", needed_for: "running the solving agent" },
    { name: "gh", command: "gh --version", needed_for: "github cli inside the sandbox" },
    { name: "git", command: "git --version", needed_for: "cloning and branching" },
    { name: "node", command: "node --version", needed_for: "running sandbox-mcp" },
    {
        name: "sandbox-mcp",
        command: `test -f ${SANDBOX_MCP_ENTRY} && echo present`,
        needed_for: "report_status, the worker's Busy/Idle signal",
    },
    {
        name: "graphify",
        command: "graphify --version",
        needed_for: "building and querying the code graph",
    },
    {
        name: "preview-runner",
        command: `node ${PREVIEW_RUNNER_ENTRY} doctor | jq -e '.ok' > /dev/null && node ${PREVIEW_RUNNER_ENTRY} doctor | jq -r '.chromiumVersion'`,
        needed_for: "launching Chromium to screenshot Product Diff targets",
    },
    {
        name: "preview-check",
        command: "preview-check --help",
        needed_for: "the harness agent's render oracle",
    },
    { name: "pnpm", command: "pnpm --version", needed_for: "installing pnpm-lock.yaml projects" },
    { name: "yarn", command: "yarn --version", needed_for: "installing yarn.lock projects" },
    { name: "bun", command: "bun --version", needed_for: "installing bun.lock projects" },
];

async function main() {
    log.step("booting sandbox to verify template", { template: TEMPLATE_NAME });
    const sandbox = await Sandbox.create(TEMPLATE_NAME, {
        apiKey: ENV.SERVER_E2B_API_KEY,
        timeoutMs: 5 * 60_000,
    });

    const missing: Requirement[] = [];
    try {
        for (const requirement of REQUIREMENTS) {
            const result = await sandbox.commands
                .run(`bash -lc ${JSON.stringify(requirement.command)}`, { timeoutMs: 60_000 })
                .catch(() => null);

            if (result && result.exitCode === 0) {
                log.success(requirement.name, { version: result.stdout.trim().split("\n")[0] });
            } else {
                missing.push(requirement);
                log.error(`${requirement.name} is MISSING`, undefined, {
                    needed_for: requirement.needed_for,
                });
            }
        }
    } finally {
        await sandbox.kill();
    }

    if (missing.length) {
        log.error(`${missing.length} requirement(s) missing — rebuild with: bun run template`);
        process.exit(1);
    }
    log.success("template has everything the runner flow needs");
    process.exit(0);
}

main().catch((error) => {
    log.error("template verification failed", error);
    process.exit(1);
});
