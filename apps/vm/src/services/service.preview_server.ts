import type Logger from "@trymatcha/logger";
import type { CommandHandle, Sandbox } from "e2b";

import type { NextPreviewLaunchPlan } from "./product_diff/adapters/next/service.next_preview_launcher";

const READY_TIMEOUT_MS = 4 * 60_000;
const READY_GRACE_MS = 30_000;
const LOG_TAIL_LINES = 20;
const DIAGNOSTIC_LOG_TAIL_LINES = 60;
const STOP_TIMEOUT_MS = 10_000;
const PROBE_PATH = "/";

export interface PreviewServerOptions {
    worktree: string;
    nextAppDir: string;
    port: number;
    label: string;
}

export interface PreviewServerHandle {
    url: string;
    healthPath: string;
    logPath: string;
    port: number;
    process: CommandHandle;
}

export interface PreviewServerRuntimeDiagnostics {
    logTail: string;
    listenerSnapshot: string;
    processSnapshot: string;
    memorySnapshot: string;
    processGroupSnapshot: string;
    httpProbeSnapshot: string;
    diskSnapshot: string;
}

function app_directory(options: PreviewServerOptions): string {
    return options.nextAppDir === "."
        ? options.worktree
        : `${options.worktree}/${options.nextAppDir}`;
}

function shell_argument(value: string): string {
    if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
    return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function is_launch_plan(
    options: PreviewServerOptions | NextPreviewLaunchPlan,
): options is NextPreviewLaunchPlan {
    return "workingDirectory" in options;
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
    static async start(sandbox: Sandbox, plan: NextPreviewLaunchPlan): Promise<PreviewServerHandle>;
    static async start(
        sandbox: Sandbox,
        options: PreviewServerOptions,
        envs: Record<string, string>,
    ): Promise<PreviewServerHandle>;
    static async start(
        sandbox: Sandbox,
        planOrOptions: NextPreviewLaunchPlan | PreviewServerOptions,
        legacyEnvs: Record<string, string> = {},
    ): Promise<PreviewServerHandle> {
        if (is_launch_plan(planOrOptions)) {
            const logPath = `/home/user/preview/${planOrOptions.port}-server.log`;
            const process = await sandbox.commands.run(
                `mkdir -p /home/user/preview && cd ${shell_argument(planOrOptions.workingDirectory)} && exec setsid ${planOrOptions.command} > ${shell_argument(logPath)} 2>&1`,
                { background: true, envs: planOrOptions.environment },
            );

            return {
                url: `http://127.0.0.1:${planOrOptions.port}`,
                healthPath: planOrOptions.healthPath,
                logPath,
                port: planOrOptions.port,
                process,
            };
        }

        const options = planOrOptions;
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
            `cd ${appDir} && exec setsid ${nextBinary} dev --hostname 127.0.0.1 --port ${options.port} > ${logPath} 2>&1`,
            { background: true, envs: legacyEnvs },
        );

        return {
            url: `http://127.0.0.1:${options.port}`,
            healthPath: PROBE_PATH,
            logPath,
            port: options.port,
            process,
        };
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
        probePath: string = server.healthPath,
    ): Promise<boolean> {
        const seconds = Math.floor(READY_TIMEOUT_MS / 1000);
        const probe = `curl -sf -o /dev/null --max-time 10 ${shell_argument(`${server.url}${probePath}`)}`;
        const retry = `until ${probe}; do sleep 1; done`;
        const waited = await sandbox.commands
            .run(`timeout ${seconds} bash -c ${shell_argument(retry)}`, {
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

    static async runtime_diagnostics(
        sandbox: Sandbox,
        server: PreviewServerHandle,
        probePath: string = server.healthPath,
    ): Promise<PreviewServerRuntimeDiagnostics> {
        const [
            logTail,
            listenerSnapshot,
            processSnapshot,
            memorySnapshot,
            processGroupSnapshot,
            httpProbeSnapshot,
            diskSnapshot,
        ] = await Promise.all([
            sandbox.commands
                .run(
                    `tail -n ${DIAGNOSTIC_LOG_TAIL_LINES} ${shell_argument(server.logPath)} 2>/dev/null || true`,
                )
                .then((result) => result.stdout.trim())
                .catch(() => ""),
            sandbox.commands
                .run(
                    `(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null || true) | grep ':${server.port} ' || true`,
                )
                .then((result) => result.stdout.trim())
                .catch(() => ""),
            sandbox.commands
                .run(
                    "ps -eo pid=,ppid=,pgid=,sid=,stat=,etimes=,rss=,vsz=,command= | grep -E '[n]ext|[t]urbo|[n]x|[p]npm|[n]ode|[b]un' || true",
                )
                .then((result) => result.stdout.trim())
                .catch(() => ""),
            sandbox.commands
                .run(
                    "(cat /sys/fs/cgroup/memory.events 2>/dev/null || true; cat /sys/fs/cgroup/memory.current 2>/dev/null || true; cat /sys/fs/cgroup/memory.max 2>/dev/null || true; cat /sys/fs/cgroup/memory.peak 2>/dev/null || true; free -m 2>/dev/null || true)",
                )
                .then((result) => result.stdout.trim())
                .catch(() => ""),
            sandbox.commands
                .run(
                    `ps -eo pid=,ppid=,pgid=,sid=,stat=,etimes=,rss=,vsz=,command= | awk '$1 == ${server.process.pid} || $3 == ${server.process.pid} { print }' || true`,
                )
                .then((result) => result.stdout.trim())
                .catch(() => ""),
            sandbox.commands
                .run(
                    `(curl -sS -D - -o /dev/null --max-time 10 ${shell_argument(`${server.url}${probePath}`)}; printf 'curl_exit=%s\\n' "$?") 2>&1`,
                    { timeoutMs: 15_000 },
                )
                .then((result) => result.stdout.trim())
                .catch(() => ""),
            sandbox.commands
                .run("df -h /home/user /tmp 2>/dev/null || true")
                .then((result) => result.stdout.trim())
                .catch(() => ""),
        ]);
        return {
            logTail,
            listenerSnapshot,
            processSnapshot,
            memorySnapshot,
            processGroupSnapshot,
            httpProbeSnapshot,
            diskSnapshot,
        };
    }

    /**
     * Stops one revision's dev server by killing the exact process that was started.
     *
     * The handle returned when the server was launched is what makes this safe. Hunting for the
     * process by matching text in command lines is how a shutdown command ends up matching itself
     * and taking down the shell it is running in.
     *
     * @example
     * await PreviewServer.stop(sandbox, server);
     */
    static async stop(sandbox: Sandbox, server: PreviewServerHandle): Promise<void> {
        const stopped = await sandbox.commands
            .run(`kill -- -${server.process.pid}`, { timeoutMs: STOP_TIMEOUT_MS })
            .then((result) => result.exitCode === 0)
            .catch(() => false);
        if (!stopped) await server.process.kill().catch(() => undefined);
    }
}
