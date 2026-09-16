import { AgentQuestionStatus, prisma } from "@trydarwin/database";
import type Logger from "@trydarwin/logger";
import { type RunLogEventBody, RunLogEventKind, RunLogLevel } from "@trydarwin/types";
import { Sandbox } from "e2b";

import { ENV } from "../../conf/config.env";

const POLL_INTERVAL_MS = 3000;
const HEARTBEAT_MS = 60_000;

function format_wait(ms: number): string {
    const total = Math.round(ms / 1000);
    if (total < 60) return `${total}s`;
    const minutes = Math.floor(total / 60);
    if (minutes < 60) return `${minutes}m ${total % 60}s`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

type WaitingQuestion = {
    id: string;
    key: string;
    prompt: string;
    options: string[];
};

export interface QuestionPauseOptions {
    session_id: string;
    sandbox_id: string;
    /**
     * Re-applied on resume. A resumed sandbox does not inherit the timeout it was created with —
     * it comes back on E2B's short default and dies mid-run a few minutes later — so the lifetime
     * the run actually needs has to be set again every time.
     */
    resume_timeout_ms: number;
    /** Detach the output stream before the snapshot, and reattach once the sandbox is back. */
    detach: () => Promise<void>;
    reattach: () => Promise<void>;
    on_event?: (event: RunLogEventBody) => void;
}

/**
 * Suspends the whole sandbox while the agent waits on a person.
 *
 * An agent blocked on `ask_user` polls in a loop, which means an idle sandbox billed for however
 * long the answer takes. Pausing snapshots the machine — the harness process and its poll survive
 * it — so the wait costs nothing and resumes exactly where it stopped.
 *
 * The answer landing in the database is the only resume trigger. Nothing needs to reach into this
 * process: it watches the question row it paused for.
 */
export default class QuestionPause {
    private stopped = false;
    private holding = false;
    private handled = new Set<string>();

    constructor(
        private readonly options: QuestionPauseOptions,
        private readonly log: Logger,
    ) {}

    public stop() {
        this.stopped = true;
    }

    /**
     * True from just before the stream is detached until after it has been reattached. The
     * supervisor sets it ahead of the pause rather than after, because the wait on the harness
     * rejects the moment the stream drops — which is before the pause call has returned.
     */
    public get is_holding() {
        return this.holding;
    }

    public async watch(): Promise<void> {
        while (!this.stopped) {
            await this.sleep(POLL_INTERVAL_MS);
            if (this.stopped) return;

            try {
                const question = await this.waiting_question();
                if (question) await this.hold_for(question);
            } catch (error) {
                this.log.warn("question pause watch failed", { error: String(error) });
            }
        }
    }

    private async waiting_question(): Promise<WaitingQuestion | null> {
        const question = await prisma.agentQuestion.findFirst({
            where: {
                agentSessionId: this.options.session_id,
                status: AgentQuestionStatus.Waiting,
            },
            orderBy: { askedAt: "desc" },
            select: { id: true, key: true, prompt: true, options: true },
        });

        if (!question || this.handled.has(question.id)) return null;
        return question;
    }

    private async hold_for(question: WaitingQuestion) {
        this.handled.add(question.id);

        this.emit({
            kind: RunLogEventKind.QuestionAsked,
            questionId: question.id,
            key: question.key,
            prompt: question.prompt,
            ...(question.options.length > 0 && { options: question.options }),
        });

        this.log.step("[agent→user] the agent is asking the user and cannot continue", {
            key: question.key,
            question: question.prompt,
            ...(question.options.length > 0 && { options: question.options.join(" | ") }),
        });
        this.holding = true;

        let paused_at = 0;

        try {
            await this.options.detach();
            await Sandbox.pause(this.options.sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
            paused_at = Date.now();
            this.log.success("sandbox paused — the wait costs nothing from here", {
                sandbox: this.options.sandbox_id,
            });

            this.emit({
                kind: RunLogEventKind.SandboxPaused,
                reason: `waiting for an answer to "${question.key}"`,
            });
        } catch (error) {
            // A sandbox that would not pause is a cost problem, never a correctness one: the
            // agent's own poll keeps working, so the run is left to carry on unpaused.
            this.log.warn("sandbox not paused while waiting on the user", {
                error: String(error),
            });
            this.emit({
                kind: RunLogEventKind.Notice,
                text: "Could not pause the sandbox — the run keeps waiting at full cost.",
                level: RunLogLevel.Warn,
            });
            await this.options.reattach().catch(() => undefined);
            this.holding = false;
            return;
        }

        const settled = await this.await_answer(question.id, paused_at);

        this.log.step("[user→agent] the user answered", {
            key: question.key,
            answer: settled.value,
            via: settled.source,
            waited: format_wait(Date.now() - paused_at),
        });

        // Recorded before the resume, because the answer is what caused it: the log should read
        // asked, paused, answered, resumed, rather than reporting the effect before the cause.
        this.emit({
            kind: RunLogEventKind.QuestionAnswered,
            key: question.key,
            value: settled.value,
            source: settled.source,
        });

        await Sandbox.connect(this.options.sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        await Sandbox.setTimeout(this.options.sandbox_id, this.options.resume_timeout_ms, {
            apiKey: ENV.VM_E2B_API_KEY,
        });
        await this.options.reattach();
        this.holding = false;

        this.log.success("sandbox resumed and the harness stream is reattached", {
            paused_for: format_wait(Date.now() - paused_at),
            timeout_restored_to: format_wait(this.options.resume_timeout_ms),
        });

        this.emit({
            kind: RunLogEventKind.SandboxResumed,
            pausedMs: Date.now() - paused_at,
        });
    }

    /**
     * A paused run makes no output of its own, so this is the only thing keeping the terminal
     * from going silent for however long the person takes to answer.
     */
    private async await_answer(
        question_id: string,
        paused_at: number,
    ): Promise<{ value: string; source: "connector" | "web" | "timeout" }> {
        let last_heartbeat = Date.now();

        for (;;) {
            if (this.stopped) return { value: "run ended", source: "timeout" };

            const question = await prisma.agentQuestion
                .findUnique({
                    where: { id: question_id },
                    select: { status: true, answerValue: true, secretId: true },
                })
                .catch(() => null);

            if (question && question.status === AgentQuestionStatus.Answered) {
                return {
                    value: question.secretId ? "(provided securely)" : (question.answerValue ?? ""),
                    source: "connector",
                };
            }

            if (question && question.status === AgentQuestionStatus.Cancelled) {
                return { value: "nobody answered in time", source: "timeout" };
            }

            if (Date.now() - last_heartbeat >= HEARTBEAT_MS) {
                last_heartbeat = Date.now();
                this.log.info("still paused, waiting on the user", {
                    waited: format_wait(Date.now() - paused_at),
                });
            }

            await this.sleep(POLL_INTERVAL_MS);
        }
    }

    private emit(event: RunLogEventBody) {
        this.options.on_event?.(event);
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
