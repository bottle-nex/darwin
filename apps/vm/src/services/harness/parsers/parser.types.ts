/* eslint-disable no-unused-vars -- base no-unused-vars doesn't understand named params in a
   TS function-type signature; this file only ever declares types. */
import type { RunLogEventBody } from "@trymatcha/types";

export interface AgentReport {
    result?: string;
    total_cost_usd?: number;
    duration_ms: number;
    num_turns?: number;
}

export interface HarnessEventParser {
    observe_line: (line: string) => void;
    extract_report: (stderr_tail: string, duration_ms: number) => AgentReport;

    /**
     * Turn one line of the harness's human-facing trace into a run-log event, or null when the
     * line describes nothing the log carries.
     *
     * Optional because it is the one part of a harness that cannot be written from its docs: the
     * trace is a rendering meant for a terminal, so a parser only exists for a harness whose
     * output has actually been observed. A harness without one keeps reporting through the
     * sandbox MCP tool alone.
     */
    observe_trace_line?: (line: string) => RunLogEventBody | null;
}
