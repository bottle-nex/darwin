import { Effort, type Harness } from "@trydarwin/database";
import { Registry } from "@trydarwin/harness";
import type Logger from "@trydarwin/logger";
import type { RunLogEventBody } from "@trydarwin/types";
import chalk from "chalk";
import type { Sandbox } from "e2b";

import SandboxStream, { truncate } from "../sandbox/service.stream";
import { type AgentReport, get_parser } from "./parsers/parser.index";

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
        try {
            const result = await sandbox.commands.run(command, {
                cwd: REPO_DIR,
                envs: options.envs,
                timeoutMs: options.timeout_ms,
                onStdout: (chunk) => stdout.push(chunk).forEach(observe),
                onStderr: (chunk) => stderr.push(chunk).forEach(trace),
            });
            stderr_tail = result.stderr;
        } finally {
            stdout.flush().forEach(observe);
            stderr.flush().forEach(trace);
        }

        return parser.extract_report(stderr_tail, Date.now() - started_at);
    }
}
