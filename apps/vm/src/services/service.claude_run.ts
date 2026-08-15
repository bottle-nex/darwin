import type { Sandbox } from "e2b";
import chalk from "chalk";
import type Logger from "@trymatcha/logger";
import SandboxStream, { truncate } from "./service.sandbox_stream";

const REPO_DIR = "/home/user/repo";
const PR_TOOL = "mcp__matcha__report_pr_opened";

const MAX_TEXT = 160;
const MAX_ARG = 100;
const MAX_RESULT = 120;

export interface AgentReport {
    result?: string;
    total_cost_usd: number;
    duration_ms: number;
    num_turns: number;
}

export interface ClaudeRunOptions {
    prompt_path: string;
    model: string;
    effort: string;
    envs: Record<string, string>;
    timeout_ms: number;
    extra_flags?: string[];
    /** Names the run in the error thrown when it produces no result event. */
    label: string;
}

interface ContentBlock {
    type: string;
    text?: string;
    name?: string;
    input?: Record<string, unknown>;
    content?: unknown;
    is_error?: boolean;
}

interface StreamEvent {
    type: string;
    subtype?: string;
    model?: string;
    message?: { content?: ContentBlock[] };
}

function repo_relative(path: string): string {
    return path.startsWith(`${REPO_DIR}/`) ? path.slice(REPO_DIR.length + 1) : path;
}

function describe_tool(name: string, input: Record<string, unknown>): string {
    const arg = (key: string) => (typeof input[key] === "string" ? (input[key] as string) : "");

    switch (name) {
        case "Read":
            return `read ${repo_relative(arg("file_path"))}`;
        case "Edit":
            return `edit ${repo_relative(arg("file_path"))}`;
        case "Write":
            return `write ${repo_relative(arg("file_path"))}`;
        case "Bash":
            return `bash: ${truncate(arg("command"), MAX_ARG)}`;
        case "Grep":
            return `grep "${truncate(arg("pattern"), MAX_ARG)}"`;
        case "Glob":
            return `glob ${truncate(arg("pattern"), MAX_ARG)}`;
        case "Task":
            return `task: ${truncate(arg("description"), MAX_ARG)}`;
        case "TodoWrite":
            return "todo list updated";
        case "WebFetch":
            return `fetch ${truncate(arg("url"), MAX_ARG)}`;
        case "WebSearch":
            return `search "${truncate(arg("query"), MAX_ARG)}"`;
        case PR_TOOL:
            return `pull request opened  ${truncate(arg("pr_url"), MAX_ARG)}`;
        default: {
            const first = Object.values(input).find((value) => typeof value === "string");
            return first ? `${name} ${truncate(String(first), MAX_ARG)}` : name;
        }
    }
}

function stringify_result(content: unknown): string {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";
    return content
        .map((part) =>
            part && typeof part === "object" && "text" in part
                ? String((part as { text: unknown }).text)
                : "",
        )
        .join(" ");
}

export default class ClaudeRun {
    /**
     * Run `claude -p` inside a sandbox and narrate it into the terminal as it happens.
     *
     * The narration is the reason this exists. `--output-format json` emits one blob when the
     * process exits, so a half-hour solve is a half-hour of silence; `stream-json` emits one
     * JSON object per line as the agent works, which is what makes a live feed possible at all.
     * `--verbose` is not decoration — the CLI refuses stream-json under `--print` without it.
     */
    public static async execute(
        sandbox: Sandbox,
        log: Logger,
        options: ClaudeRunOptions,
    ): Promise<AgentReport> {
        // Collected rather than assigned: the last result event wins, and pushing from a
        // callback keeps the value visible to the type checker after the await.
        const reports: AgentReport[] = [];

        const trace = (line: string) => log.stream(chalk.dim(truncate(line, MAX_TEXT)));

        const render = (line: string) => {
            let event: StreamEvent;
            try {
                event = JSON.parse(line);
            } catch {
                // Not an event, so something unexpected reached stdout — a warning, a crash.
                // Showing it raw is the point: swallowing it would turn a diagnosable failure
                // into the silence this whole change exists to remove.
                trace(line);
                return;
            }

            if (event.type === "result") {
                reports.push(event as unknown as AgentReport);
                return;
            }

            for (const rendered of ClaudeRun.render_event(event)) {
                log.stream(rendered);
            }
        };

        const stdout = SandboxStream.lines();
        const stderr = SandboxStream.lines();

        const flags = [
            `--model ${options.model}`,
            `--effort ${options.effort}`,
            "--output-format stream-json --verbose",
            "--permission-mode bypassPermissions",
            ...(options.extra_flags ?? []),
        ].join(" ");

        // Flushed in `finally` and before the report is read: a timeout rejects the run, and the
        // result event is the last line of stdout — with no trailing newline it is still sitting
        // in the buffer at this point.
        let stderr_tail = "";
        try {
            const result = await sandbox.commands.run(
                `claude -p "$(cat ${options.prompt_path})" ${flags}`,
                {
                    cwd: REPO_DIR,
                    envs: options.envs,
                    timeoutMs: options.timeout_ms,
                    onStdout: (chunk) => stdout.push(chunk).forEach(render),
                    onStderr: (chunk) => stderr.push(chunk).forEach(trace),
                },
            );
            stderr_tail = result.stderr;
        } finally {
            stdout.flush().forEach(render);
            stderr.flush().forEach(trace);
        }

        const report = reports.at(-1);
        if (!report) {
            throw new Error(
                `${options.label} produced no result event: ${stderr_tail.slice(-500)}`,
            );
        }
        return report;
    }

    /**
     * Unrecognised event types render to nothing on purpose. A real run also emits
     * `rate_limit_event`, `hook_started`, `hook_response` and `thinking_tokens`, none of which
     * say anything about what the agent is doing, and the list grows with every CLI release —
     * dropping them keeps the feed readable and makes a new event type a non-event.
     */
    private static render_event(event: StreamEvent): string[] {
        if (event.type === "system" && event.subtype === "init") {
            return [chalk.dim(`session started  model=${event.model ?? "unknown"}`)];
        }

        if (event.type === "assistant" || event.type === "user") {
            return (event.message?.content ?? [])
                .map((block) => ClaudeRun.render_block(block))
                .filter((line): line is string => line !== null);
        }

        return [];
    }

    private static render_block(block: ContentBlock): string | null {
        if (block.type === "text") {
            const text = truncate(block.text ?? "", MAX_TEXT);
            return text ? `${chalk.white("▪")} ${chalk.white(text)}` : null;
        }

        if (block.type === "tool_use") {
            const name = block.name ?? "tool";
            const summary = describe_tool(name, block.input ?? {});
            // The PR is the whole point of the run — it should not scroll past looking like
            // every other tool call.
            const paint = name === PR_TOOL ? chalk.greenBright : chalk.cyan;
            return `${paint(name === PR_TOOL ? "✔" : "⟩")} ${paint(summary)}`;
        }

        if (block.type === "tool_result") {
            const body = truncate(stringify_result(block.content), MAX_RESULT);
            if (!body) return null;
            const paint = block.is_error ? chalk.yellowBright : chalk.dim;
            return `${paint("↳")} ${paint(body)}`;
        }

        // Thinking blocks are skipped: long, and the tool calls already show the work.
        return null;
    }
}
