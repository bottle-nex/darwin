import { Sandbox, type CommandResult, type CommandStartOpts } from "e2b";
import { ok as assert } from "node:assert/strict";
import Logger from "@trymatcha/logger";
import { ENV } from "../conf/config.env";
import GraphService from "../services/service.graph";

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
const GRAPHIFY_VERSION = "0.9.43";

interface Requirement {
    name: string;
    command: string;
    /** Why the runner needs it, printed when it is missing. */
    needed_for: string;
}

const REQUIREMENTS: Requirement[] = [
    { name: "claude", command: "claude --version", needed_for: "running the solving agent" },
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
        command: `graphify --version | grep -F ${GRAPHIFY_VERSION}`,
        needed_for: "building and querying the code graph",
    },
];

async function run(
    sandbox: Sandbox,
    command: string,
    options: CommandStartOpts & { background?: false } = {},
): Promise<CommandResult> {
    return sandbox.commands.run(command, { ...options, background: false });
}

async function verify_requirements(sandbox: Sandbox): Promise<void> {
    let missing = 0;
    const results = await Promise.all(
        REQUIREMENTS.map((requirement) =>
            sandbox.commands
                .run(`bash -lc ${JSON.stringify(requirement.command)}`, { timeoutMs: 60_000 })
                .catch(() => null),
        ),
    );

    for (const [index, requirement] of REQUIREMENTS.entries()) {
        const result = results[index];
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
    await run(
        sandbox,
        `rm -rf ${REPO_DIR} && mkdir -p ${REPO_DIR}/src ${REPO_DIR}/.claude && git init -q -b main ${REPO_DIR} && git -C ${REPO_DIR} config user.email matcha@example.invalid && git -C ${REPO_DIR} config user.name Matcha`,
        { timeoutMs: 60_000 },
    );
    await Promise.all([
        sandbox.files.write(`${REPO_DIR}/src/base.ts`, 'export const baseSymbol = "v1";\n'),
        sandbox.files.write(`${REPO_DIR}/CLAUDE.md`, "# Customer instructions\n"),
        sandbox.files.write(`${REPO_DIR}/.claude/settings.json`, "{}\n"),
        sandbox.files.write(`${REPO_DIR}/.claudeignore`, "customer-cache/\n"),
        sandbox.files.write(`${REPO_DIR}/.env`, "MATCHA_TEST_SECRET=hidden\n"),
    ]);
    await run(sandbox, "git add -A && git commit -qm base", { cwd: REPO_DIR });

    await GraphService.protect(sandbox);
    assert(
        (await GraphService.prepare(sandbox, log)) === "ready",
        "initial Graphify preparation did not reach ready",
    );
    await run(
        sandbox,
        "test -s graphify-out/graph.json && test -s graphify-out/manifest.json && test -s .claude/skills/graphify/SKILL.md && grep -q graphify .claude/settings.json",
        { cwd: REPO_DIR },
    );
    const read_hook = await run(
        sandbox,
        'jq -er \'.hooks.PreToolUse[] | select(.matcher == "Read|Glob") | .hooks[] | select(.type == "command") | .command\' .claude/settings.json',
        { cwd: REPO_DIR },
    );
    const hook_payload = JSON.stringify({
        session_id: "matcha-template-strict",
        tool_name: "Read",
        tool_input: { file_path: "src/base.ts" },
    });
    const strict_hook = await run(
        sandbox,
        `printf %s ${JSON.stringify(hook_payload)} | GRAPHIFY_HOOK_STRICT=1 ${read_hook.stdout.trim()}`,
        { cwd: REPO_DIR },
    );
    assert(
        JSON.parse(strict_hook.stdout).hookSpecificOutput?.permissionDecision === "deny",
        "strict Graphify hook did not block the first raw source read",
    );
    const disabled_hook = await run(
        sandbox,
        `printf %s ${JSON.stringify(hook_payload.replace("matcha-template-strict", "matcha-template-disabled"))} | GRAPHIFY_HOOK_STRICT=0 ${read_hook.stdout.trim()}`,
        { cwd: REPO_DIR },
    );
    assert(
        JSON.parse(disabled_hook.stdout).hookSpecificOutput?.permissionDecision !== "deny",
        "GRAPHIFY_HOOK_STRICT=0 did not disable the strict read block",
    );

    await run(sandbox, "git add -A", { cwd: REPO_DIR });
    const staged = await run(sandbox, "git diff --cached --name-only", { cwd: REPO_DIR });
    assert(!staged.stdout.trim(), `Graphify files reached the Git index: ${staged.stdout}`);

    await sandbox.files.write(`${REPO_DIR}/src/base.ts`, 'export const baseSymbol = "v2";\n');
    await run(sandbox, "git add src/base.ts && git commit -qm update-base", { cwd: REPO_DIR });

    const incremental_lines: string[] = [];
    const original_stream = log.stream.bind(log);
    log.stream = (line: string) => {
        incremental_lines.push(line);
        original_stream(line);
    };
    await GraphService.prepare(sandbox, log);
    const incremental = incremental_lines.find((line) => line.includes("changed;"));
    assert(
        incremental,
        `graphify did not report an incremental scan: ${incremental_lines.join("\n")}`,
    );
    const query = await run(sandbox, "graphify query baseSymbol --graph graphify-out/graph.json", {
        cwd: REPO_DIR,
        timeoutMs: 60_000,
    });
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
