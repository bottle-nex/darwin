import chalk from "chalk";

import { truncate } from "../service.sandbox_stream";
import type { AgentReport, HarnessEventParser } from "./parser.types";

const MAX_TEXT = 160;

/**
 * UNVERIFIED. `--print-logs` (packages/harness's guess at OpenCode's invocation) may just mean
 * "human-readable logs to stdout," not a structured/parseable event stream the way Claude's
 * stream-json or Codex's --json aim to be — there is no confirmed machine-parseable format to
 * design against. Built as a thin plain-text passthrough rather than pretending to understand
 * events: try JSON as a bonus, degrade to raw text either way.
 *
 * Deliberately never throws from extract_report, same reasoning as the Codex parser.
 */
export default class OpenCodeEventParser implements HarnessEventParser {
    private last_text: string | undefined;

    render_line(line: string): string[] {
        try {
            const event = JSON.parse(line);
            const text =
                event && typeof event === "object"
                    ? ((event as Record<string, unknown>).text ??
                      (event as Record<string, unknown>).message)
                    : undefined;
            if (typeof text === "string" && text.trim()) {
                this.last_text = text;
                return [`${chalk.cyan("⟩")} ${chalk.cyan(truncate(text, MAX_TEXT))}`];
            }
        } catch {
            // not JSON — fall through to plain text
        }

        if (!line.trim()) return [];
        this.last_text = line;
        return [chalk.dim(truncate(line, MAX_TEXT))];
    }

    extract_report(_stderr_tail: string, duration_ms: number): AgentReport {
        return { result: this.last_text, duration_ms };
    }
}
