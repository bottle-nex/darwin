import { type RunLogEventBody, RunLogEventKind } from "@trydarwin/types";

import type { AgentReport, HarnessEventParser } from "./parser.types";

// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE = /\[[0-9;]*[A-Za-z]/g;

const READ = /^→ Read (.+)$/;
const SKILL = /^→ Skill "(.+)"$/;
const WRITE = /^[←→] Write (.+)$/;
const SEARCH = /^✱ (?:Grep|Glob) "(.+)" \d+ match(?:es)?$/;

/**
 * Lines that echo a tool call rather than report an action of their own.
 *
 * `⟩` renders the arguments of the tool opencode is about to run and `⚙` renders the call
 * itself, so a darwin_report_progress call prints its own payload here. Reading those would
 * record every reported action twice: once from the agent's own report, and once from opencode
 * narrating that the report happened.
 */
const TOOL_ECHO = /^[⟩⚙]/;

/** opencode's structured logger, which describes the harness rather than the work. */
const LOGGER_LINE = /(^|\s)timestamp=\S+\s+level=/;

/**
 * Reads one line of opencode's trace into a run-log event.
 *
 * Exported for tests: the mapping is a set of claims about opencode's output format, and those
 * are worth pinning to examples rather than rediscovering them from a broken run.
 */
export function parse_opencode_trace(raw: string): RunLogEventBody | null {
    const line = raw.replace(ANSI_ESCAPE, "").trim();
    if (!line || TOOL_ECHO.test(line) || LOGGER_LINE.test(line)) return null;

    const read = READ.exec(line);
    if (read?.[1]) return { kind: RunLogEventKind.FileRead, path: read[1] };

    const write = WRITE.exec(line);
    if (write?.[1]) return { kind: RunLogEventKind.FileWrite, path: write[1], mode: "edit" };

    const search = SEARCH.exec(line);
    if (search?.[1]) return { kind: RunLogEventKind.Search, pattern: search[1] };

    const skill = SKILL.exec(line);
    if (skill?.[1]) return { kind: RunLogEventKind.Notice, text: `skill: ${skill[1]}` };

    return null;
}

/**
 * opencode is invoked with `run --print-logs`, which prints a trace meant for a person rather
 * than an event stream: there is no completion event to read a result from, so the report is the
 * last thing the run said and its duration is measured by the caller.
 */
export default class OpenCodeEventParser implements HarnessEventParser {
    private last_text: string | undefined;

    observe_line(line: string): RunLogEventBody | null {
        try {
            const event = JSON.parse(line);
            const text =
                event && typeof event === "object"
                    ? ((event as Record<string, unknown>).text ??
                      (event as Record<string, unknown>).message)
                    : undefined;
            if (typeof text === "string" && text.trim()) {
                this.last_text = text;
                return null;
            }
        } catch {
            // not JSON — fall through to plain text
        }

        if (line.trim()) this.last_text = line;
        return null;
    }

    observe_trace_line(line: string): RunLogEventBody | null {
        return parse_opencode_trace(line);
    }

    extract_report(_stderr_tail: string, duration_ms: number): AgentReport {
        return { result: this.last_text, duration_ms };
    }
}
