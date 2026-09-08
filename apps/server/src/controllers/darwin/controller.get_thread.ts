import type { Request, Response } from "express";
import z from "zod";

import DarwinThreadService from "../../services/darwin/service.darwin_thread";
import ResponseWriter from "../../services/service.response";
import { reject_darwin_context, resolve_darwin_context } from "./darwin.context";

/**
 * `GET /darwin/threads/:project_id/:thread_id` — one conversation with its messages.
 *
 * Carries `activeRunId`, which is how a tab reloaded mid-answer knows there is still a run to
 * resubscribe to rather than showing a half-finished thread.
 *
 * Responses: 401 · 400 INVALID_DATA · 404 · 200 `DarwinThreadDetail`.
 */
export default class DarwinGetThreadController {
    static params_schema = z.object({
        project_id: z.string().min(1),
        thread_id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const params = DarwinGetThreadController.params_schema.safeParse(req.params);
            if (!params.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const resolved = await resolve_darwin_context(req, params.data.project_id);
            if (!resolved.ok) {
                reject_darwin_context(res, resolved);
                return;
            }

            const thread = await DarwinThreadService.detail(
                params.data.thread_id,
                resolved.ctx.projectId,
                resolved.ctx.userId,
            );
            if (!thread) {
                ResponseWriter.not_found(res, "Conversation not found");
                return;
            }

            ResponseWriter.success(res, thread, "Conversation fetched successfully");
        } catch (err) {
            console.error("DarwinGetThreadController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
