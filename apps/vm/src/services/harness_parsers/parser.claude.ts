import chalk from "chalk";

import { truncate } from "../service.sandbox_stream";
import type { AgentReport, HarnessEventParser } from "./parser.types";

const REPO_DIR = "/home/user/repo";

const MAX_TEXT = 160;
const MAX_ARG = 100;
const MAX_RESULT = 120;

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

function render_block(block: ContentBlock): string | null {
    if (block.type === "text") {
        const text = truncate(block.text ?? "", MAX_TEXT);
        return text ? `${chalk.white("▪")} ${chalk.white(text)}` : null;
    }

    if (block.type === "tool_use") {
        const name = block.name ?? "tool";
        const summary = describe_tool(name, block.input ?? {});
        return `${chalk.cyan("⟩")} ${chalk.cyan(summary)}`;
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

function render_event(event: StreamEvent): string[] {
    if (event.type === "system" && event.subtype === "init") {
        return [chalk.dim(`session started  model=${event.model ?? "unknown"}`)];
    }

    if (event.type === "assistant" || event.type === "user") {
        return (event.message?.content ?? [])
            .map((block) => render_block(block))
            .filter((line): line is string => line !== null);
    }

    return [];
}

/**
 * `--output-format json` emits one blob when the process exits, so a half-hour solve is a
 * half-hour of silence; `stream-json` emits one JSON object per line as the agent works,
 * which is what makes a live feed possible at all.
 */
export default class ClaudeEventParser implements HarnessEventParser {
    private reports: AgentReport[] = [];

    render_line(line: string): string[] {
        let event: StreamEvent;
        try {
            event = JSON.parse(line);
        } catch {
            // Not an event, so something unexpected reached stdout — a warning, a crash.
            // Showing it raw is the point: swallowing it would turn a diagnosable failure
            // into the silence this parser exists to remove.
            return [chalk.dim(truncate(line, MAX_TEXT))];
        }

        if (event.type === "result") {
            this.reports.push(event as unknown as AgentReport);
            return [];
        }

        return render_event(event);
    }

    extract_report(stderr_tail: string): AgentReport {
        const report = this.reports.at(-1);
        if (!report) {
            throw new Error(`claude produced no result event: ${stderr_tail.slice(-500)}`);
        }
        return report;
    }
}
