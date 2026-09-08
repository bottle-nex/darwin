import { type RunLogEventBody, RunLogEventKind } from "@trydarwin/types";

import type { AgentReport, HarnessEventParser } from "./parser.types";

const REPO_DIR = "/home/user/repo";

interface ToolUseBlock {
    type: "tool_use";
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
}

interface ToolResultBlock {
    type: "tool_result";
    tool_use_id?: string;
    is_error?: boolean;
    content?: unknown;
}

type ContentBlock = ToolUseBlock | ToolResultBlock | { type: string };

interface StreamEvent {
    type: string;
    message?: { content?: ContentBlock[] };
}

/**
 * A path inside the repo, or null for anything else.
 *
 * The sandbox holds our own scaffolding beside the clone — the PR body among it — and a write
 * there is not a change to the reader's code, so it does not belong in a log about their repo.
 */
const repo_relative = (path: string): string | null =>
    path.startsWith(`${REPO_DIR}/`) ? path.slice(REPO_DIR.length + 1) : null;

const result_text = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (!Array.isArray(value)) return "";
    return value
        .map((part) =>
            part &&
            typeof part === "object" &&
            typeof (part as { text?: unknown }).text === "string"
                ? (part as { text: string }).text
                : "",
        )
        .join("\n");
};

const string_input = (block: ToolUseBlock, key: string): string => {
    const value = block.input?.[key];
    return typeof value === "string" ? value.trim() : "";
};

const written_file = (block: ToolUseBlock, mode: "edit" | "create"): RunLogEventBody | null => {
    const path = repo_relative(string_input(block, "file_path"));
    return path ? { kind: RunLogEventKind.FileWrite, path, mode } : null;
};

export default class ClaudeEventParser implements HarnessEventParser {
    private reports: AgentReport[] = [];

    private readonly commands_by_tool_use = new Map<string, string>();

    observe_line(line: string): RunLogEventBody | null {
        let event: StreamEvent;
        try {
            event = JSON.parse(line);
        } catch {
            return null;
        }

        if (event.type === "result") {
            this.reports.push(event as unknown as AgentReport);
            return null;
        }

        for (const block of event.message?.content ?? []) {
            const observed = this.observe_block(block);
            if (observed) return observed;
        }
        return null;
    }

    private observe_block(block: ContentBlock): RunLogEventBody | null {
        if (block.type === "tool_use") return this.observe_tool_use(block as ToolUseBlock);
        if (block.type === "tool_result") return this.observe_tool_result(block as ToolResultBlock);
        return null;
    }

    private observe_tool_use(block: ToolUseBlock): RunLogEventBody | null {
        const name = block.name ?? "";
        // a report_progress call already delivers the action it describes, so reading the call
        // itself would enter every reported action a second time.
        if (!name || name.startsWith("mcp__")) return null;

        switch (name) {
            case "Read": {
                const path = repo_relative(string_input(block, "file_path"));
                return path ? { kind: RunLogEventKind.FileRead, path } : null;
            }
            case "Write":
                return written_file(block, "create");
            case "Edit":
            case "MultiEdit":
            case "NotebookEdit":
                return written_file(block, "edit");
            // Held until its result arrives: the row carries the command and what it printed,
            // and only the result knows the second half.
            case "Bash": {
                const command = string_input(block, "command");
                if (command && block.id) this.commands_by_tool_use.set(block.id, command);
                return null;
            }
            case "Grep":
            case "Glob": {
                const pattern = string_input(block, "pattern");
                return pattern ? { kind: RunLogEventKind.Search, pattern } : null;
            }
            case "Task": {
                const description = string_input(block, "description");
                return description
                    ? { kind: RunLogEventKind.Notice, text: `task: ${description}` }
                    : null;
            }
            default:
                return null;
        }
    }

    private observe_tool_result(block: ToolResultBlock): RunLogEventBody | null {
        const id = block.tool_use_id;
        if (!id) return null;

        const command = this.commands_by_tool_use.get(id);
        if (!command) return null;
        this.commands_by_tool_use.delete(id);

        return {
            kind: RunLogEventKind.Command,
            command,
            output: result_text(block.content),
            exitCode: block.is_error ? 1 : 0,
        };
    }

    extract_report(stderr_tail: string): AgentReport {
        const report = this.reports.at(-1);
        if (!report) {
            throw new Error(`claude produced no result event: ${stderr_tail.slice(-500)}`);
        }
        return report;
    }
}
