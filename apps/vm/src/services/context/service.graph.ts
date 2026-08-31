import { Harness } from "@trymatcha/database";
import type Logger from "@trymatcha/logger";
import type { CommandStartOpts, Sandbox } from "e2b";

import SandboxStream from "../sandbox/service.stream";

const REPO_DIR = "/home/user/repo";
const GRAPHIFY_ROOT = "/home/user/.matcha/graphify";
export const GRAPHIFY_OUT = `${GRAPHIFY_ROOT}/graphify-out`;
export const GRAPHIFY_INTEGRATION = `${GRAPHIFY_ROOT}/integration`;
export const GRAPHIFY_SETTINGS = `${GRAPHIFY_INTEGRATION}/.claude/settings.json`;

const BUILD_TIMEOUT_MS = 15 * 60_000;

const GRAPHIFY_PLATFORM: Record<Harness, string> = {
    [Harness.Claude]: "claude",
    [Harness.Codex]: "codex",
    [Harness.OpenCode]: "opencode",
};

function install_cwd(harness: Harness): string {
    return harness === Harness.Claude ? GRAPHIFY_INTEGRATION : REPO_DIR;
}

function state_path(harness: Harness): string {
    return `${GRAPHIFY_ROOT}/state-${GRAPHIFY_PLATFORM[harness]}`;
}

export default class GraphService {
    public static async prepare(
        sandbox: Sandbox,
        log: Logger,
        harness: Harness,
    ): Promise<"ready" | "disabled"> {
        const platform = GRAPHIFY_PLATFORM[harness];
        const cwd = install_cwd(harness);
        const state_file = state_path(harness);

        try {
            await GraphService.run_checked(sandbox, `mkdir -p ${cwd}`);
            const state = (
                await GraphService.run_checked(sandbox, `cat ${state_file} 2>/dev/null || true`)
            ).stdout.trim();
            if (state === "disabled") return state;

            const started = Date.now();
            log.step(state === "ready" ? "synchronizing code graph" : "building code graph", {
                harness,
            });
            await GraphService.run_graphify(sandbox, "graphify extract . --code-only", log, {
                envs: { GRAPHIFY_OUT },
            });
            await GraphService.run_checked(
                sandbox,
                `jq -e '(.nodes | length) > 0' ${GRAPHIFY_OUT}/graph.json`,
                { timeoutMs: 60_000 },
            );

            if (state !== "ready") {
                await GraphService.run_graphify(
                    sandbox,
                    `graphify ${platform} install --project --strict`,
                    log,
                    { cwd, envs: { GRAPHIFY_OUT } },
                );
                await GraphService.run_checked(sandbox, `printf ready > ${state_file}`);
            }

            log.success("code graph ready", {
                harness,
                took: `${Math.round((Date.now() - started) / 1000)}s`,
            });
            return "ready";
        } catch (error) {
            log.error("code graph unavailable, disabling Graphify", error, { harness });
            await GraphService.run_checked(sandbox, `printf disabled > ${state_file}`).catch(
                (persist_error) =>
                    log.error("could not persist disabled Graphify state", persist_error),
            );
            return "disabled";
        }
    }

    private static async run_graphify(
        sandbox: Sandbox,
        command: string,
        log: Logger,
        options: CommandStartOpts & { background?: false } = {},
    ) {
        const stream = SandboxStream.plain(log);
        try {
            return await GraphService.run_checked(sandbox, command, {
                ...options,
                timeoutMs: BUILD_TIMEOUT_MS,
                onStdout: stream.onStdout,
                onStderr: stream.onStderr,
            });
        } finally {
            stream.flush();
        }
    }

    private static async run_checked(
        sandbox: Sandbox,
        command: string,
        options: CommandStartOpts & { background?: false } = {},
    ) {
        return sandbox.commands.run(command, { cwd: REPO_DIR, ...options, background: false });
    }
}
