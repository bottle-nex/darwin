import Logger from "@trymatcha/logger";
import { Sandbox } from "e2b";

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
const TEMPLATE_TAG = "stable";
const SANDBOX_MCP_ENTRY = "/opt/matcha/sandbox-mcp/index.js";
const CAPSULE_CHECK_ENTRY = "/opt/matcha/capsule-check/index.js";
const SANDBOX_MCP_TOOLS = ["report_status", "report_progress"];

/**
 * Asks the MCP server which tools it serves, over its own stdio protocol.
 *
 * A bundle built before a tool existed still starts and still prints its startup line, so
 * booting it proves nothing about what the agent can actually call. The handshake is the only
 * thing that separates a current bundle from a stale one. Closing stdin after the last message
 * ends the server the same way reading from /dev/null did.
 *
 * Written as one pipeline with no shell variable in it: this string is quoted twice on its way
 * into the sandbox, and anything the outer shell could expand or unquote is a false MISSING
 * that reads exactly like a genuinely broken bundle.
 */
const mcp_tools_probe = () => {
    const handshake = [
        {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "template-verify", version: "0" },
            },
        },
        { jsonrpc: "2.0", method: "notifications/initialized" },
        { jsonrpc: "2.0", id: 2, method: "tools/list" },
    ]
        .map((message) => `'${JSON.stringify(message)}'`)
        .join(" ");

    const served = SANDBOX_MCP_TOOLS.map((tool) => `"name":"${tool}"`).join("|");

    return [
        `printf '%s\n' ${handshake}`,
        `| MATCHA_SESSION_KIND=worker node ${SANDBOX_MCP_ENTRY} 2>/dev/null`,
        `| grep -oE '${served}' | sort -u`,
        `| awk 'END { if (NR == ${SANDBOX_MCP_TOOLS.length}) print "${SANDBOX_MCP_TOOLS.join(", ")}"; else exit 1 }'`,
    ].join(" ");
};

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
        /**
         * Serving the tools, not just located and not just started. A bundle with an import the
         * sandbox cannot resolve is still a file on disk, and a stdio MCP server that dies on
         * startup is invisible — the agent simply runs without the tools and nothing anywhere
         * says why. A bundle that starts but predates a tool fails the same way, which is what
         * the handshake below catches and booting it did not.
         */
        name: "sandbox-mcp",
        command: mcp_tools_probe(),
        needed_for: "report_progress and report_status, the agent's own way to report",
    },
    {
        name: "graphify",
        command: "graphify --version",
        needed_for: "building and querying the code graph",
    },
    {
        name: "capsule-check",
        command: `test -f ${CAPSULE_CHECK_ENTRY} && echo present`,
        needed_for: "grading whether a built capsule actually renders",
    },
    {
        name: "chromium",
        command: `cd /opt/matcha/capsule-check && node -e "import('playwright').then(async (p) => { const b = await p.chromium.launch(); console.log(b.version()); await b.close(); })"`,
        needed_for: "opening capsule pages to check them",
    },
    {
        name: "npx",
        command: "npx --version",
        needed_for: "installing and running the capsule build harness",
    },
    { name: "pnpm", command: "pnpm --version", needed_for: "installing pnpm-lock.yaml projects" },
    { name: "yarn", command: "yarn --version", needed_for: "installing yarn.lock projects" },
    { name: "bun", command: "bun --version", needed_for: "installing bun.lock projects" },
];

async function main() {
    log.step("booting sandbox to verify template", {
        template: `${TEMPLATE_NAME}:${TEMPLATE_TAG}`,
    });
    const sandbox = await Sandbox.create(`${TEMPLATE_NAME}:${TEMPLATE_TAG}`, {
        apiKey: ENV.VM_E2B_API_KEY,
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
