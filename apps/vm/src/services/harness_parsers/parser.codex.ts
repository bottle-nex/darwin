import chalk from "chalk";

import { truncate } from "../service.sandbox_stream";
import type { AgentReport, HarnessEventParser } from "./parser.types";

const MAX_TEXT = 160;

/**
 * UNVERIFIED. `codex exec --json`'s actual event schema has never been captured against a
 * real run — this is a best-effort guess at a Claude-Code-shaped JSONL stream (some
 * text/message-bearing field per line), not a confirmed format. Expect this to need rewriting
 * once someone runs `codex exec --json` for real and captures its actual output.
 *
 * Deliberately never throws from extract_report: an unrecognized-but-successful run must not
 * get marked failed just because this guessed parser didn't match its shape.
 */
export default class CodexEventParser implements HarnessEventParser {
    private last_text: string | undefined;

    render_line(line: string): string[] {
        let event: unknown;
        try {
            event = JSON.parse(line);
        } catch {
            return [chalk.dim(truncate(line, MAX_TEXT))];
        }

        if (!event || typeof event !== "object") return [];
        const text = this.extract_text(event as Record<string, unknown>);
        if (!text) return [];

        this.last_text = text;
        return [`${chalk.cyan("⟩")} ${chalk.cyan(truncate(text, MAX_TEXT))}`];
    }

    extract_report(_stderr_tail: string, duration_ms: number): AgentReport {
        return { result: this.last_text, duration_ms };
    }

    private extract_text(event: Record<string, unknown>): string | null {
        for (const key of ["text", "message", "content", "output"]) {
            const value = event[key];
            if (typeof value === "string" && value.trim()) return value;
        }
        return null;
    }
}
