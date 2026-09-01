import type Logger from "@trymatcha/logger";
import {
    RUN_LOG_MAX_COMMAND_LENGTH,
    RUN_LOG_MAX_FAILURE_OUTPUT_LENGTH,
    RUN_LOG_MAX_NOTICE_LENGTH,
    RUN_LOG_MAX_PATH_LENGTH,
    type RunLogEventBody,
    RunLogEventKind,
    type RunLogPhase,
} from "@trymatcha/types";
import { z } from "zod";

import { redact } from "../sandbox/service.stream";
import RunLogCache, { type RunLogOwner } from "./service.cache";
import { render_event } from "./service.render";

// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE = /\[[0-9;]*[A-Za-z]/g;

export type RunLogWriteResult = "stored" | "duplicate" | "refused" | "ignored" | "unsupported";

/**
 * The events a sandbox is allowed to report about itself.
 *
 * Narrower than the full set on purpose: phase changes and run failures are what this worker
 * observed, so an agent cannot claim a phase it never reached or a failure that did not happen.
 */
const reported_event_schema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal(RunLogEventKind.FileRead), path: z.string() }),
    z.object({
        kind: z.literal(RunLogEventKind.FileWrite),
        path: z.string(),
        mode: z.enum(["edit", "create"]).default("edit"),
    }),
    z.object({ kind: z.literal(RunLogEventKind.Search), pattern: z.string() }),
    z.object({ kind: z.literal(RunLogEventKind.Command), command: z.string() }),
    z.object({
        kind: z.literal(RunLogEventKind.CommandFailed),
        command: z.string(),
        output: z.string().default(""),
    }),
    z.object({ kind: z.literal(RunLogEventKind.Notice), text: z.string() }),
]);

type ReportedEvent = z.infer<typeof reported_event_schema>;

/**
 * Writes one action into the cache, from either of the two things that can describe a run.
 *
 * Deliberately holds nothing: the caller answers the sandbox with the outcome of this write, so
 * anything buffered here would be acknowledged before it was stored, and a restart would lose
 * events the sandbox had already been told to forget.
 *
 * A run is described from two sides — the agent reporting itself through the MCP tool, and this
 * worker watching the harness's trace — so the ordering they share cannot come from either one.
 * This writer owns it. The number the sandbox sends is kept as the identity of its report, which
 * is what still makes a retry safe, but it names the report rather than its position.
 */
export default class RunLogWriter {
    private next_seq = 0;

    /** Sandbox report number → the sequence it was stored under, so a retry is recognised. */
    private readonly reported = new Map<number, number>();

    private last_identity: string | null = null;

    private constructor(
        private readonly run_id: string,
        private readonly owner: RunLogOwner,
        private readonly secrets: string[],
        private readonly log: Logger,
    ) {}

    static open(run_id: string, owner: RunLogOwner, secrets: string[], log: Logger): RunLogWriter {
        return new RunLogWriter(run_id, owner, secrets, log);
    }

    /** Records an action the agent reported about itself, identified by the sandbox's number. */
    async write(phase: RunLogPhase, seq: number, event: unknown): Promise<RunLogWriteResult> {
        if (this.reported.has(seq)) return "duplicate";

        const result = await this.store(phase, event);
        if (result === "stored") this.reported.set(seq, this.next_seq);
        return result;
    }

    /**
     * Records an action this worker watched the harness take.
     *
     * Carries no report number because nothing retries it: the trace is read once as it streams,
     * and a line that fails to store is gone rather than resent.
     */
    async write_observed(phase: RunLogPhase, event: unknown): Promise<RunLogWriteResult> {
        return this.store(phase, event);
    }

    private async store(phase: RunLogPhase, event: unknown): Promise<RunLogWriteResult> {
        const parsed = reported_event_schema.safeParse(event);
        if (!parsed.success) return "unsupported";

        const body = this.sanitize(parsed.data);
        if (!body) return "ignored";

        // Both sides describe the same run, so the same action can arrive twice — the agent
        // reports a write, and the trace shows the harness performing it a moment later. Only
        // an immediate repeat is dropped: the same file read twice in a row is worth seeing.
        const identity = RunLogWriter.identity(body);
        if (identity === this.last_identity) return "ignored";

        this.next_seq += 1;
        const result = await RunLogCache.append(this.run_id, this.owner, {
            ...body,
            seq: this.next_seq,
            ts: new Date().toISOString(),
            phase,
        });

        if (result === "stored") {
            this.last_identity = identity;
            this.log.stream(render_event(body, phase));
        }
        return result;
    }

    private static identity(body: RunLogEventBody): string {
        switch (body.kind) {
            case RunLogEventKind.FileRead:
            case RunLogEventKind.FileWrite:
                return `${body.kind}:${body.path}`;
            case RunLogEventKind.Search:
                return `${body.kind}:${body.pattern}`;
            case RunLogEventKind.Command:
            case RunLogEventKind.CommandFailed:
                return `${body.kind}:${body.command}`;
            default:
                return `${body.kind}:${"text" in body ? body.text : ""}`;
        }
    }

    private clean(text: string, limit: number): string {
        return redact(text.replace(ANSI_ESCAPE, ""), this.secrets).trim().slice(0, limit);
    }

    /**
     * Failure output is kept from the end, not the start: a command that broke says why on its
     * last lines, and the head is the part the command string already tells you.
     */
    private tail(text: string, limit: number): string {
        const cleaned = redact(text.replace(ANSI_ESCAPE, ""), this.secrets).trim();
        return cleaned.length > limit ? cleaned.slice(-limit) : cleaned;
    }

    private sanitize(event: ReportedEvent): RunLogEventBody | null {
        switch (event.kind) {
            case RunLogEventKind.FileRead: {
                const path = this.clean(event.path, RUN_LOG_MAX_PATH_LENGTH);
                return path ? { ...event, path } : null;
            }
            case RunLogEventKind.FileWrite: {
                const path = this.clean(event.path, RUN_LOG_MAX_PATH_LENGTH);
                return path ? { ...event, path } : null;
            }
            case RunLogEventKind.Search: {
                const pattern = this.clean(event.pattern, RUN_LOG_MAX_COMMAND_LENGTH);
                return pattern ? { ...event, pattern } : null;
            }
            case RunLogEventKind.Command: {
                const command = this.clean(event.command, RUN_LOG_MAX_COMMAND_LENGTH);
                return command ? { ...event, command } : null;
            }
            case RunLogEventKind.CommandFailed: {
                const command = this.clean(event.command, RUN_LOG_MAX_COMMAND_LENGTH);
                if (!command) return null;
                return {
                    ...event,
                    command,
                    output: this.tail(event.output, RUN_LOG_MAX_FAILURE_OUTPUT_LENGTH),
                };
            }
            default: {
                const text = this.clean(event.text, RUN_LOG_MAX_NOTICE_LENGTH);
                return text ? { ...event, text } : null;
            }
        }
    }
}
