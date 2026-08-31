import type { AgentReport, HarnessEventParser } from "./parser.types";

interface StreamEvent {
    type: string;
}

export default class ClaudeEventParser implements HarnessEventParser {
    private reports: AgentReport[] = [];

    observe_line(line: string): void {
        let event: StreamEvent;
        try {
            event = JSON.parse(line);
        } catch {
            return;
        }
        if (event.type === "result") this.reports.push(event as unknown as AgentReport);
    }

    extract_report(stderr_tail: string): AgentReport {
        const report = this.reports.at(-1);
        if (!report) {
            throw new Error(`claude produced no result event: ${stderr_tail.slice(-500)}`);
        }
        return report;
    }
}
