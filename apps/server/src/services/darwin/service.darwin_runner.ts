import { DarwinRunStatus } from "@trydarwin/database";

import DarwinAgent from "./service.darwin_agent";
import DarwinPrompt from "./service.darwin_prompt";
import DarwinStream from "./service.darwin_stream";
import DarwinThreadService from "./service.darwin_thread";
import { OpenRouterError } from "./service.openrouter";
import type { DarwinContext } from "./tools/tool.registry";

const in_flight = new Map<string, AbortController>();

const GENERIC_FAILURE = "Darwin could not finish that. Try again.";

/**
 * Runs one Ask Darwin turn detached from the HTTP request that started it.
 *
 * The POST returns as soon as the run row exists, so a reload cannot kill the answer: the loop
 * keeps going here and the finished message lands in Postgres either way.
 *
 * @example
 * void DarwinRunner.execute({ runId, threadId, ctx, message: "what's in review?" });
 */
export default class DarwinRunner {
    static async execute(input: {
        runId: string;
        threadId: string;
        ctx: DarwinContext;
        message: string;
    }) {
        const abort = new AbortController();
        in_flight.set(input.runId, abort);

        const stream = new DarwinStream(input.ctx.projectId, input.runId);

        try {
            const history = await DarwinThreadService.window(input.threadId);
            await DarwinThreadService.append_user(input.threadId, input.runId, input.message);

            const result = await DarwinAgent.run({
                ctx: input.ctx,
                messages: [
                    DarwinPrompt.system(input.ctx),
                    ...history,
                    { role: "user", content: input.message },
                ],
                signal: abort.signal,
                emit: (event) => stream.emit(event),
            });

            const messageId = await DarwinThreadService.finish_run(
                input.threadId,
                input.runId,
                result,
            );

            stream.emit({ type: "done", messageId: messageId ?? input.runId, text: result.text });
            await stream.seal("Done");
        } catch (error) {
            if (abort.signal.aborted) {
                await DarwinThreadService.close_run(input.runId, DarwinRunStatus.Cancelled);
                await stream.seal("Cancelled");
                return;
            }

            const code = error instanceof OpenRouterError ? error.code : "DARWIN_FAILED";
            console.error(`[darwin] run ${input.runId} failed`, error);
            await DarwinThreadService.close_run(
                input.runId,
                DarwinRunStatus.Error,
                (error as Error).message,
            );
            stream.emit({ type: "error", code, message: GENERIC_FAILURE });
            await stream.seal("Error");
        } finally {
            in_flight.delete(input.runId);
        }
    }

    /**
     * Stop a run.
     *
     * Only works on the instance that owns it, because the controller lives in memory. With more
     * than one server behind a load balancer this needs a `darwin:cancel:<runId>` key the loop
     * checks between iterations — not needed yet, but it is the known gap.
     */
    static cancel(run_id: string): boolean {
        const abort = in_flight.get(run_id);
        if (!abort) return false;
        abort.abort();
        return true;
    }
}
