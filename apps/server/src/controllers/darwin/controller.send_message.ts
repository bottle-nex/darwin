import { DARWIN_MESSAGE_MAX_LENGTH } from "@trydarwin/types";
import type { Request, Response } from "express";
import z from "zod";

import DarwinRunner from "../../services/darwin/service.darwin_runner";
import DarwinThreadService from "../../services/darwin/service.darwin_thread";
import ResponseWriter from "../../services/service.response";
import { reject_darwin_context, resolve_darwin_context } from "./darwin.context";

/**
 * `POST /darwin/messages` — ask Darwin something.
 *
 * Returns as soon as the run row exists and lets the loop carry on detached, because holding the
 * response open for a 30-second multi-tool answer is what makes a page reload lose the work. The
 * answer arrives over the socket instead; the client subscribes with the `runId` returned here.
 *
 * Responses: 401 · 400 INVALID_DATA · 404 · 201 `{ threadId, runId }`.
 */
export default class DarwinSendMessageController {
    static body_schema = z.object({
        project_id: z.string().min(1),
        thread_id: z.string().min(1).optional(),
        message: z.string().min(1).max(DARWIN_MESSAGE_MAX_LENGTH),
    });

    static async process(req: Request, res: Response) {
        try {
            const body = DarwinSendMessageController.body_schema.safeParse(req.body);
            if (!body.success) {
                ResponseWriter.invalid_data(res, "Invalid Darwin request");
                return;
            }

            const resolved = await resolve_darwin_context(req, body.data.project_id);
            if (!resolved.ok) {
                reject_darwin_context(res, resolved);
                return;
            }

            const thread = await DarwinThreadService.resolve({
                threadId: body.data.thread_id,
                projectId: body.data.project_id,
                userId: resolved.ctx.userId,
                firstMessage: body.data.message,
            });
            if (!thread) {
                ResponseWriter.not_found(res, "Conversation not found");
                return;
            }

            const run = await DarwinThreadService.start_run(thread.id);

            void DarwinRunner.execute({
                runId: run.id,
                threadId: thread.id,
                ctx: resolved.ctx,
                message: body.data.message,
            }).catch((error) => {
                console.error("DarwinRunner detached failure: ", error);
            });

            ResponseWriter.created(
                res,
                { threadId: thread.id, runId: run.id },
                "Darwin is thinking",
            );
        } catch (err) {
            console.error("DarwinSendMessageController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
