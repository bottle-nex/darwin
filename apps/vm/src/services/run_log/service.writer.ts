import type Logger from "@trydarwin/logger";
import {
    RUN_LOG_MAX_COMMAND_LENGTH,
    RUN_LOG_MAX_COMMIT_BODY_LENGTH,
    RUN_LOG_MAX_NOTICE_LENGTH,
    RUN_LOG_MAX_OUTPUT_LENGTH,
    RUN_LOG_MAX_PATH_LENGTH,
    RUN_LOG_MAX_STEP_LENGTH,
    RUN_LOG_MAX_TITLE_LENGTH,
    type RunLogEventBody,
    RunLogEventKind,
    RunLogLevel,
    type RunLogPhase,
} from "@trydarwin/types";
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
 * Narrower than the full set on purpose: the milestones are what this worker observed, so an
 * agent cannot claim it pushed a branch or finished a run that never happened. A step is the one
 * addition, because the agent is the only thing that knows its own intent.
 */
const reported_event_schema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal(RunLogEventKind.Step), text: z.string() }),
    z.object({ kind: z.literal(RunLogEventKind.FileRead), path: z.string() }),
    z.object({
        kind: z.literal(RunLogEventKind.FileWrite),
        path: z.string(),
        mode: z.enum(["edit", "create"]).default("edit"),
    }),
    z.object({ kind: z.literal(RunLogEventKind.Search), pattern: z.string() }),
    z.object({
        kind: z.literal(RunLogEventKind.Command),
        command: z.string(),
        title: z.string().optional(),
        output: z.string().optional(),
        exitCode: z.number().int().optional(),
    }),
    z.object({
        kind: z.literal(RunLogEventKind.Notice),
        text: z.string(),
        level: z.enum([RunLogLevel.Info, RunLogLevel.Warn, RunLogLevel.Error]).optional(),
    }),
]);

/**
 * Everything the worker itself can record — the sandbox's vocabulary plus the milestones only
 * this process can vouch for, because it is the one that performed them.
 */
const observed_event_schema = z.union([
    reported_event_schema,
    z.discriminatedUnion("kind", [
        z.object({ kind: z.literal(RunLogEventKind.AgentFinished), durationMs: z.number() }),
        z.object({
            kind: z.literal(RunLogEventKind.ChangesSummary),
            files: z.number().int(),
            insertions: z.number().int(),
            deletions: z.number().int(),
        }),
        z.object({ kind: z.literal(RunLogEventKind.RunFailed), reason: z.string() }),
        z.object({
            kind: z.literal(RunLogEventKind.Committed),
            sha: z.string(),
            subject: z.string(),
            body: z.string().optional(),
        }),
        z.object({
            kind: z.literal(RunLogEventKind.PullRequestOpened),
            number: z.number().int(),
            url: z.string(),
        }),
        z.object({
            kind: z.literal(RunLogEventKind.QuestionAsked),
            questionId: z.string(),
            key: z.string(),
            prompt: z.string(),
            options: z.array(z.string()).optional(),
        }),
        z.object({
            kind: z.literal(RunLogEventKind.QuestionAnswered),
            key: z.string(),
            value: z.string(),
            source: z.enum(["connector", "web", "timeout"]),
        }),
        z.object({ kind: z.literal(RunLogEventKind.SandboxPaused), reason: z.string() }),
        z.object({ kind: z.literal(RunLogEventKind.SandboxResumed), pausedMs: z.number() }),
    ]),
]);

type ReportedEvent = z.infer<typeof observed_event_schema>;

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

    private last_stored: { identity: string; seq: number; titled: boolean } | null = null;

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
        return this.store(phase, event, observed_event_schema);
    }

    private async store(
        phase: RunLogPhase,
        event: unknown,
        schema: z.ZodType<ReportedEvent> = reported_event_schema,
    ): Promise<RunLogWriteResult> {
        const parsed = schema.safeParse(event);
        if (!parsed.success) return "unsupported";

        const body = this.sanitize(parsed.data);
        if (!body) return "ignored";

        // Both sides describe the same run, so the same action can arrive twice — the agent
        // reports a write, and the trace shows the harness performing it a moment later. Only
        // an immediate repeat is dropped: the same file read twice in a row is worth seeing.
        const identity = RunLogWriter.identity(body);
        const titled = RunLogWriter.titled(body);
        const open = this.last_stored;

        if (open?.identity === identity) {
            // The trace always reaches this writer before the agent's own report of the same
            // command, so the version carrying a readable title arrives second and would
            // otherwise be thrown away as a repeat.
            if (!titled || open.titled) return "ignored";

            await RunLogCache.replace(this.run_id, this.owner, {
                ...body,
                seq: open.seq,
                ts: new Date().toISOString(),
                phase,
            });
            this.last_stored = { identity, seq: open.seq, titled };
            return "stored";
        }

        this.next_seq += 1;
        const result = await RunLogCache.append(this.run_id, this.owner, {
            ...body,
            seq: this.next_seq,
            ts: new Date().toISOString(),
            phase,
        });

        if (result === "stored") {
            this.last_stored = { identity, seq: this.next_seq, titled };
            this.log.stream(render_event(body, phase));
        }
        return result;
    }

    /** Whether this event carries a human title, which is what lets it replace a bare duplicate. */
    private static titled(body: RunLogEventBody): boolean {
        return body.kind === RunLogEventKind.Command && Boolean(body.title);
    }

    private static identity(body: RunLogEventBody): string {
        switch (body.kind) {
            case RunLogEventKind.FileRead:
            case RunLogEventKind.FileWrite:
                return `${body.kind}:${body.path}`;
            case RunLogEventKind.Search:
                return `${body.kind}:${body.pattern}`;
            // Keyed by the question, since a run asks several in a row and they would otherwise
            // all share one identity and be dropped as repeats of each other.
            case RunLogEventKind.QuestionAsked:
            case RunLogEventKind.QuestionAnswered:
                return `${body.kind}:${body.key}`;
            case RunLogEventKind.Command:
                return `${body.kind}:${body.command}`;
            default:
                return `${body.kind}:${"text" in body ? body.text : ""}`;
        }
    }

    private clean(text: string, limit: number): string {
        return redact(text.replace(ANSI_ESCAPE, ""), this.secrets)
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, limit);
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
            case RunLogEventKind.FileRead:
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
                if (!command) return null;
                return {
                    ...event,
                    command,
                    title: event.title
                        ? this.clean(event.title, RUN_LOG_MAX_TITLE_LENGTH)
                        : undefined,
                    output: event.output
                        ? this.tail(event.output, RUN_LOG_MAX_OUTPUT_LENGTH)
                        : undefined,
                };
            }
            case RunLogEventKind.Committed: {
                const subject = this.clean(event.subject, RUN_LOG_MAX_TITLE_LENGTH);
                if (!subject) return null;
                return {
                    ...event,
                    subject,
                    body: event.body
                        ? this.tail(event.body, RUN_LOG_MAX_COMMIT_BODY_LENGTH)
                        : undefined,
                };
            }
            case RunLogEventKind.Step: {
                const text = this.clean(event.text, RUN_LOG_MAX_STEP_LENGTH);
                return text ? { ...event, text } : null;
            }
            case RunLogEventKind.Notice: {
                const text = this.clean(event.text, RUN_LOG_MAX_NOTICE_LENGTH);
                return text ? { ...event, text } : null;
            }
            case RunLogEventKind.QuestionAsked: {
                const prompt = this.clean(event.prompt, RUN_LOG_MAX_NOTICE_LENGTH);
                return prompt ? { ...event, prompt } : null;
            }
            // An answer is typed by a person and lands in stored output like any other text, so
            // it is redacted and capped the same way rather than trusted.
            case RunLogEventKind.QuestionAnswered: {
                const value = this.clean(event.value, RUN_LOG_MAX_NOTICE_LENGTH);
                return value ? { ...event, value } : null;
            }
            default:
                return event;
        }
    }
}
