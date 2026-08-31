import { Effort, type Harness } from "@trymatcha/database";
import { Registry } from "@trymatcha/harness";
import type Logger from "@trymatcha/logger";
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

        // stdout is the harness's event stream, not a feed for a person: it is read for the
        // run's outcome only, and what the agent did reaches the log from the agent itself.
        const observe = (line: string) => parser.observe_line(line);
        const trace = (line: string) => log.stream(chalk.dim(truncate(line, MAX_TEXT)));
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
