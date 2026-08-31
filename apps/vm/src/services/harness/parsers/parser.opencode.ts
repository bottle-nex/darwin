import type { AgentReport, HarnessEventParser } from "./parser.types";

// need to build this after research about how opencode sends data
export default class OpenCodeEventParser implements HarnessEventParser {
    private last_text: string | undefined;

    observe_line(line: string): void {
        try {
            const event = JSON.parse(line);
            const text =
                event && typeof event === "object"
                    ? ((event as Record<string, unknown>).text ??
                      (event as Record<string, unknown>).message)
                    : undefined;
            if (typeof text === "string" && text.trim()) {
                this.last_text = text;
                return;
            }
        } catch {
            // not JSON — fall through to plain text
        }

        if (line.trim()) this.last_text = line;
    }

    extract_report(_stderr_tail: string, duration_ms: number): AgentReport {
        return { result: this.last_text, duration_ms };
    }
}
