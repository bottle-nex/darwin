import type { CommandStartOpts, Sandbox } from "e2b";
import type Logger from "@trymatcha/logger";
import SandboxStream from "./service.sandbox_stream";

const REPO_DIR = "/home/user/repo";
const GRAPHIFY_ROOT = "/home/user/.matcha/graphify";
export const GRAPHIFY_OUT = `${GRAPHIFY_ROOT}/graphify-out`;
export const GRAPHIFY_INTEGRATION = `${GRAPHIFY_ROOT}/integration`;
export const GRAPHIFY_SETTINGS = `${GRAPHIFY_INTEGRATION}/.claude/settings.json`;
const STATE_PATH = `${GRAPHIFY_ROOT}/state`;

const BUILD_TIMEOUT_MS = 15 * 60_000;

export default class GraphService {
    public static async prepare(sandbox: Sandbox, log: Logger): Promise<"ready" | "disabled"> {
        try {
            await GraphService.run_checked(sandbox, `mkdir -p ${GRAPHIFY_INTEGRATION}`);
            const state = (
                await GraphService.run_checked(sandbox, `cat ${STATE_PATH} 2>/dev/null || true`)
            ).stdout.trim();
            if (state === "disabled") return state;

            const started = Date.now();
            log.step(state === "ready" ? "synchronizing code graph" : "building code graph");
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
                    "graphify install --project --strict",
                    log,
                    { cwd: GRAPHIFY_INTEGRATION, envs: { GRAPHIFY_OUT } },
                );
                await GraphService.run_checked(sandbox, `printf ready > ${STATE_PATH}`);
            }

            log.success("code graph ready", {
                took: `${Math.round((Date.now() - started) / 1000)}s`,
            });
            return "ready";
        } catch (error) {
            log.error("code graph unavailable — disabling Graphify", error);
            await GraphService.run_checked(sandbox, `printf disabled > ${STATE_PATH}`).catch(
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
