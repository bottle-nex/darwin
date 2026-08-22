import type Logger from "@trymatcha/logger";
import type { CommandHandle, Sandbox } from "e2b";

const READY_TIMEOUT_MS = 4 * 60_000;
const READY_GRACE_MS = 30_000;
const LOG_TAIL_LINES = 20;
const PROBE_PATH = "/matcha-preview/matcha-probe";

export interface PreviewServerOptions {
    worktree: string;
    nextAppDir: string;
    port: number;
    label: string;
}

export interface PreviewServerHandle {
    url: string;
    logPath: string;
    port: number;
    process: CommandHandle;
}

function app_directory(options: PreviewServerOptions): string {
    return options.nextAppDir === "."
        ? options.worktree
        : `${options.worktree}/${options.nextAppDir}`;
}

export default class PreviewServer {
    /**
     * Starts one revision's Next.js dev server in the background.
     *
     * The `next` binary is invoked directly rather than through the project's own `dev` script,
     * because that script may pin a port the other revision is already using, or start a whole
     * monorepo, or bring a backend up alongside it. Output is kept in a file so a server that never
     * becomes ready can still explain itself.
     *
     * @example
     * const server = await PreviewServer.start(sandbox, { worktree, nextAppDir: "apps/web", port: 41337, label: "head" });
     * // { url: "http://127.0.0.1:41337", logPath: "/home/user/preview/head.log", port: 41337 }
     */
    static async start(
        sandbox: Sandbox,
        options: PreviewServerOptions,
        envs: Record<string, string>,
    ): Promise<PreviewServerHandle> {
        const appDir = app_directory(options);
        const logPath = `/home/user/preview/${options.label}-server.log`;

        const binary = await sandbox.commands.run(
            `if [ -x ${appDir}/node_modules/.bin/next ]; then echo ${appDir}/node_modules/.bin/next; elif [ -x ${options.worktree}/node_modules/.bin/next ]; then echo ${options.worktree}/node_modules/.bin/next; else echo missing; fi`,
        );
        const nextBinary = binary.stdout.trim();
        if (nextBinary === "missing") {
            throw new Error(`the ${options.label} revision has no installed next binary`);
        }

        const process = await sandbox.commands.run(
            `cd ${appDir} && ${nextBinary} dev --hostname 127.0.0.1 --port ${options.port} > ${logPath} 2>&1`,
            { background: true, envs },
        );

        return { url: `http://127.0.0.1:${options.port}`, logPath, port: options.port, process };
    }

    /**
     * Waits until a revision can actually serve a page, not merely until its port opens.
     *
     * The probe route proves three things in one request: the server is listening, the route tree
     * compiles, and the app's root layout renders without throwing. An app whose layout awaits a
     * session will open its port happily and then fail on every page, and only the probe catches
     * that before the agent has spent fifteen minutes writing harnesses nothing can render.
     *
     * @example
     * await PreviewServer.wait_until_ready(sandbox, server, log); // true when the probe answers 200
     */
    static async wait_until_ready(
        sandbox: Sandbox,
        server: PreviewServerHandle,
        log: Logger,
    ): Promise<boolean> {
        const seconds = Math.floor(READY_TIMEOUT_MS / 1000);
        const probe = `curl -sf -o /dev/null --max-time 10 ${server.url}${PROBE_PATH}`;
        const waited = await sandbox.commands
            .run(`timeout ${seconds} bash -c 'until ${probe}; do sleep 1; done'`, {
                timeoutMs: READY_TIMEOUT_MS + READY_GRACE_MS,
            })
            .catch(() => null);

        if (waited && waited.exitCode === 0) return true;

        log.warn("dev server never answered the probe", { port: server.port });
        return false;
    }

    /**
     * Reads the last few lines a dev server printed, for putting a real reason on a failed run.
     *
     * @example
     * await PreviewServer.log_tail(sandbox, server);
     * // "Error: Cannot find module 'next/font/google'\n    at ..."
     */
    static async log_tail(sandbox: Sandbox, server: PreviewServerHandle): Promise<string> {
        const result = await sandbox.commands
            .run(`tail -n ${LOG_TAIL_LINES} ${server.logPath} 2>/dev/null || true`)
            .catch(() => null);
        return result?.stdout.trim() ?? "";
    }

    /**
     * Stops one revision's dev server by killing the exact process that was started.
     *
     * The handle returned when the server was launched is what makes this safe. Hunting for the
     * process by matching text in command lines is how a shutdown command ends up matching itself
     * and taking down the shell it is running in.
     *
     * @example
     * await PreviewServer.stop(server);
     */
    static async stop(server: PreviewServerHandle): Promise<void> {
        await server.process.kill().catch(() => undefined);
    }
}
