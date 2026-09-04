import { Effort, type Harness } from "@trydarwin/database";
import { Registry } from "@trydarwin/harness";
import type Logger from "@trydarwin/logger";
import type { RunLogEventBody } from "@trydarwin/types";
import chalk from "chalk";
import type { Sandbox } from "e2b";

import SandboxStream, { truncate } from "../sandbox/service.stream";
import { type AgentReport, get_parser } from "./parsers/parser.index";
import QuestionPause, { type QuestionPauseOptions } from "./service.question_pause";

type EnvEffort = "low" | "medium" | "high" | "xhigh" | "max";

const ENV_EFFORT_TO_EFFORT: Record<EnvEffort, Effort> = {
    low: Effort.Low,
    medium: Effort.Medium,
    high: Effort.High,
    xhigh: Effort.XHigh,
    max: Effort.Max,
};

/** Bridges the lowercase env-string effort format (still used by brief/product-diff, which
 * are always-Claude features outside the multi-harness selection system) to the Effort enum. */
export function effort_from_env(value: EnvEffort): Effort {
    return ENV_EFFORT_TO_EFFORT[value];
}

const REPO_DIR = "/home/user/repo";
const MAX_TEXT = 160;
const RESUME_POLL_MS = 2000;
const MAX_STREAM_RECONNECTS = 5;

export interface HarnessRunOptions {
    harness: Harness;
    prompt_path: string;
    model: string;
    effort: Effort | null;
    envs: Record<string, string>;
    timeout_ms: number;
    extra_flags?: string[];
    /** Names the run in the error thrown when it produces no result event. */
    label: string;
    /**
     * Receives what the harness was seen doing, for harnesses whose parser can read their trace.
     *
     * Runs that have no log to write into leave this out, and a harness with no trace parser
     * never calls it — in both cases the run behaves exactly as it did before.
     */
    on_observed?: (event: RunLogEventBody) => void;
    /**
     * Suspends the sandbox whenever the agent is blocked on a question. Only the issue-solving
     * run passes this; brief, preview and product-diff runs never wait on a person.
     */
    pause_on_question?: Omit<QuestionPauseOptions, "detach" | "reattach" | "on_event">;
}

export type { AgentReport };

export default class HarnessRun {
    public static async execute(
        sandbox: Sandbox,
        log: Logger,
        options: HarnessRunOptions,
    ): Promise<AgentReport> {
        const agent = Registry.get(options.harness);
        const parser = get_parser(options.harness);

        const command = agent
            .buildArgv({
                promptPath: options.prompt_path,
                model: options.model,
                effort: options.effort ?? undefined,
                extra: options.extra_flags ?? [],
            })
            .join(" ");

        // Both streams can describe an action. stdout is the harness's event stream, which for
        // a harness that names its tool calls there is the complete record of the run; stderr is
        // the rendering meant for a person, which is where a harness with no event stream says
        // what it did. Whichever a harness has, its parser reads — the agent's own reports
        // through the sandbox MCP tool cover only the actions it chooses to report.
        const emit = (event: RunLogEventBody | null) => {
            if (event && options.on_observed) options.on_observed(event);
        };
        const observe = (line: string) => emit(parser.observe_line(line));
        const trace = (line: string) => {
            log.stream(chalk.dim(truncate(line, MAX_TEXT)));
            if (parser.observe_trace_line) emit(parser.observe_trace_line(line));
        };
        const stdout = SandboxStream.lines();
        const stderr = SandboxStream.lines();

        // Wall-clock, not any harness's self-reported duration — Claude's result event
        // supplies its own, but Codex/OpenCode's completion event is unverified and may not
        // exist, so this is the one thing reliably available across all three.
        const started_at = Date.now();
        let stderr_tail = "";

        // Started detached rather than awaited, because a run that can be paused mid-flight
        // cannot hold its output stream open: pausing drops the connection, and only a command
        // we own by pid can be reattached to on the other side of the snapshot.
        const sinks = {
            onStdout: (chunk: string) => stdout.push(chunk).forEach(observe),
            onStderr: (chunk: string) => stderr.push(chunk).forEach(trace),
        };

        let handle = await sandbox.commands.run(command, {
            cwd: REPO_DIR,
            envs: options.envs,
            timeoutMs: options.timeout_ms,
            background: true,
            ...sinks,
        });

        const pid = handle.pid;
        const pause = options.pause_on_question
            ? new QuestionPause(
                  {
                      ...options.pause_on_question,
                      detach: () => handle.disconnect(),
                      reattach: async () => {
                          handle = await sandbox.commands.connect(pid, {
                              timeoutMs: options.timeout_ms,
                              ...sinks,
                          });
                      },
                      on_event: emit,
                  },
                  log,
              )
            : null;

        if (pause) void pause.watch();

        try {
            const result = await HarnessRun.settle(
                () => handle,
                async () => {
                    handle = await sandbox.commands.connect(pid, {
                        timeoutMs: options.timeout_ms,
                        ...sinks,
                    });
                },
                pause,
                log,
            );
            stderr_tail = result.stderr;
        } finally {
            pause?.stop();
            stdout.flush().forEach(observe);
            stderr.flush().forEach(trace);
        }

        return parser.extract_report(stderr_tail, Date.now() - started_at);
    }

    /**
     * Waits for the detached command, treating a lost connection as a pause rather than a
     * failure. `wait()` rejects when the snapshot takes the stream down with it, so the handle is
     * re-read after the supervisor has resumed and reattached, and the wait is retried on it.
     */
    /**
     * Waits for the detached command, reconnecting rather than failing when the stream drops.
     *
     * The process lives in the sandbox, not in this connection, so a dropped stream says nothing
     * about whether the run is still going — it is exactly what a pause does, and what a network
     * blip looks like. Reattaching by pid is the whole reason the command is started detached;
     * only a command that has genuinely gone away is a failure.
     */
    private static async settle(
        current: () => CommandHandleLike,
        reattach: () => Promise<void>,
        pause: QuestionPause | null,
        log: Logger,
    ): Promise<{ stderr: string }> {
        let reconnects = 0;

        for (;;) {
            try {
                return await current().wait();
            } catch (error) {
                if (pause?.is_holding) {
                    while (pause.is_holding) {
                        await new Promise((resolve) => setTimeout(resolve, RESUME_POLL_MS));
                    }

                    log.info("sandbox resumed — waiting on the harness again");
                    continue;
                }

                if (reconnects >= MAX_STREAM_RECONNECTS) throw error;
                reconnects += 1;

                log.warn("harness stream dropped — reattaching to the running command", {
                    attempt: `${reconnects}/${MAX_STREAM_RECONNECTS}`,
                    error: String(error),
                });

                await new Promise((resolve) => setTimeout(resolve, RESUME_POLL_MS));

                try {
                    await reattach();
                } catch {
                    // Nothing to reattach to means the command really is gone, and the original
                    // stream error is the one that describes why.
                    throw error;
                }
            }
        }
    }
}

interface CommandHandleLike {
    wait(): Promise<{ stderr: string }>;
}
