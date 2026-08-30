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
 * Writes one reported action straight through to the cache.
 *
 * Deliberately holds nothing: the caller answers the sandbox with the outcome of this write, so
 * anything buffered here would be acknowledged before it was stored, and a restart would lose
 * events the sandbox had already been told to forget. Sequence numbers come from the sandbox for
 * the same reason — a retry has to carry the identity of the event it is replacing.
 */
export default class RunLogWriter {
    private constructor(
        private readonly run_id: string,
        private readonly owner: RunLogOwner,
        private readonly secrets: string[],
        private readonly log: Logger,
    ) {}

    static open(run_id: string, owner: RunLogOwner, secrets: string[], log: Logger): RunLogWriter {
        return new RunLogWriter(run_id, owner, secrets, log);
    }

    async write(phase: RunLogPhase, seq: number, event: unknown): Promise<RunLogWriteResult> {
        const parsed = reported_event_schema.safeParse(event);
        if (!parsed.success) return "unsupported";

        const body = this.sanitize(parsed.data);
        if (!body) return "ignored";

        const result = await RunLogCache.append(this.run_id, this.owner, {
            ...body,
            seq,
            ts: new Date().toISOString(),
            phase,
        });

        if (result === "stored") this.log.stream(render_event(body, phase));
        return result;
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
