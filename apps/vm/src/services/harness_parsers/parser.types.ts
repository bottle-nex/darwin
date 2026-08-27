/* eslint-disable no-unused-vars -- base no-unused-vars doesn't understand named params in a
   TS function-type signature; this file only ever declares types. */
export interface AgentReport {
    result?: string;
    total_cost_usd?: number;
    duration_ms: number;
    num_turns?: number;
}

export interface HarnessEventParser {
    render_line: (line: string) => string[];
    extract_report: (stderr_tail: string, duration_ms: number) => AgentReport;
}
