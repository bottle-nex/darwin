import { Sandbox } from "e2b";
import { ok as assert } from "node:assert/strict";
import Logger from "@trymatcha/logger";
import { ENV } from "../conf/config.env";
import GraphService, {
    GRAPHIFY_INTEGRATION,
    GRAPHIFY_OUT,
    GRAPHIFY_SETTINGS,
} from "../services/service.graph";

const log = Logger.scope("template");

/**
 * Boots one throwaway sandbox and verifies the installed tools plus the exact Graphify workflow
 * used by worker sandboxes. No Claude run is started, so this smoke test has no model cost.
 *
 * Run with: bun run template:verify
 */

const TEMPLATE_NAME = "node-py-claude-template";
const SANDBOX_MCP_ENTRY = "/opt/matcha/sandbox-mcp/index.js";
const REPO_DIR = "/home/user/repo";

const REQUIREMENTS = [
    {
        name: "claude",
        command:
            "claude --version && claude --help | grep -F -- '--settings' >/dev/null && claude --help | grep -F -- '--add-dir' >/dev/null",
        needed_for: "running Claude with the external Graphify integration",
    },
    { name: "gh", command: "gh --version", needed_for: "opening pull requests" },
    { name: "git", command: "git --version", needed_for: "cloning and branching" },
    { name: "node", command: "node --version", needed_for: "running sandbox-mcp" },
    {
        name: "sandbox-mcp",
        command: `test -f ${SANDBOX_MCP_ENTRY} && echo present`,
        needed_for: "recording opened pull requests",
    },
    {
        name: "graphify",
        command: "graphify --version",
        needed_for: "building and querying the code graph",
    },
];

async function verify_requirements(sandbox: Sandbox): Promise<void> {
    let missing = 0;
    for (const requirement of REQUIREMENTS) {
        const result = await sandbox.commands
            .run(`bash -lc ${JSON.stringify(requirement.command)}`, { timeoutMs: 60_000 })
            .catch(() => null);
        if (!result) {
            missing++;
            log.error(`${requirement.name} is MISSING`, undefined, {
                needed_for: requirement.needed_for,
            });
            continue;
        }

        const version = `${result.stdout}\n${result.stderr}`.trim().split("\n")[0];
        log.success(requirement.name, { version });
    }

    if (missing) {
        throw new Error(`${missing} requirement(s) missing — rebuild with: bun run template`);
    }
}

async function verify_graphify_workflow(sandbox: Sandbox): Promise<void> {
    await sandbox.commands.run(
        `rm -rf ${REPO_DIR} ${GRAPHIFY_INTEGRATION} ${GRAPHIFY_OUT} && mkdir -p ${REPO_DIR}/src && git init -q -b main ${REPO_DIR} && git -C ${REPO_DIR} config user.email matcha@example.invalid && git -C ${REPO_DIR} config user.name Matcha`,
        { timeoutMs: 60_000 },
    );
    await sandbox.files.write(`${REPO_DIR}/src/base.ts`, 'export const baseSymbol = "v1";\n');
    await sandbox.files.write(`${REPO_DIR}/CLAUDE.md`, "# Customer instructions\n");
    await sandbox.commands.run("git add -A && git commit -qm base", { cwd: REPO_DIR });

    assert(
        (await GraphService.prepare(sandbox, log)) === "ready",
        "initial Graphify preparation did not reach ready",
    );
    await sandbox.commands.run(
        `test -s ${GRAPHIFY_OUT}/graph.json && test -s ${GRAPHIFY_OUT}/manifest.json && test -s ${GRAPHIFY_INTEGRATION}/.claude/skills/graphify/SKILL.md && grep -q graphify ${GRAPHIFY_SETTINGS} && test ! -e ${REPO_DIR}/graphify-out`,
    );
    const read_hook = await sandbox.commands.run(
        `jq -er '.hooks.PreToolUse[] | select(.matcher == "Read|Glob") | .hooks[] | select(.type == "command") | .command' ${GRAPHIFY_SETTINGS}`,
    );
    const hook_payload = JSON.stringify({
        session_id: "matcha-template-strict",
        tool_name: "Read",
        tool_input: { file_path: "src/base.ts" },
    });
    const strict_hook = await sandbox.commands.run(
        `printf %s ${JSON.stringify(hook_payload)} | ${read_hook.stdout.trim()}`,
        {
            cwd: REPO_DIR,
            envs: { GRAPHIFY_OUT },
        },
    );
    assert(
        JSON.parse(strict_hook.stdout).hookSpecificOutput?.permissionDecision === "deny",
        "strict Graphify hook did not block the first raw source read",
    );
    const worktree = await sandbox.commands.run("git status --porcelain", { cwd: REPO_DIR });
    assert(!worktree.stdout.trim(), `Graphify changed the customer repo: ${worktree.stdout}`);

    await sandbox.files.write(`${REPO_DIR}/src/base.ts`, 'export const baseSymbol = "v2";\n');
    await sandbox.commands.run("git add src/base.ts && git commit -qm update-base", {
        cwd: REPO_DIR,
    });

    assert(
        (await GraphService.prepare(sandbox, log)) === "ready",
        "incremental Graphify preparation did not reach ready",
    );
    const query = await sandbox.commands.run(
        `graphify query baseSymbol --graph ${GRAPHIFY_OUT}/graph.json`,
        {
            cwd: REPO_DIR,
            timeoutMs: 60_000,
        },
    );
    assert(query.stdout.trim(), "updated graph returned no result for baseSymbol");
}

async function main() {
    log.step("booting sandbox to verify template", { template: TEMPLATE_NAME });
    const sandbox = await Sandbox.create(TEMPLATE_NAME, {
        apiKey: ENV.SERVER_E2B_API_KEY,
        timeoutMs: 20 * 60_000,
    });

    try {
        await verify_requirements(sandbox);
        await verify_graphify_workflow(sandbox);
    } finally {
        await sandbox.kill();
    }

    log.success("template has everything the runner flow needs");
}

main().catch((error) => {
    log.error("template verification failed", error);
    process.exit(1);
});
