import type { RunLogEventBody } from "@trymatcha/types";

import type { AgentReport, HarnessEventParser } from "./parser.types";

// need to build this after research about how codex sends data
export default class CodexEventParser implements HarnessEventParser {
    private last_text: string | undefined;

    observe_line(line: string): RunLogEventBody | null {
        let event: unknown;
        try {
            event = JSON.parse(line);
        } catch {
            return null;
        }

        if (!event || typeof event !== "object") return null;
        const text = this.extract_text(event as Record<string, unknown>);
        if (text) this.last_text = text;
        return null;
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
