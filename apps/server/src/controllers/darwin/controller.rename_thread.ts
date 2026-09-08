import type { Request, Response } from "express";
import z from "zod";

import DarwinThreadService from "../../services/darwin/service.darwin_thread";
import ResponseWriter from "../../services/service.response";
import { reject_darwin_context, resolve_darwin_context } from "./darwin.context";

/**
 * `PATCH /darwin/threads/:project_id/:thread_id` — give a conversation a name.
 *
 * Responses: 401 · 400 INVALID_DATA · 404 · 200 `DarwinThreadSummary`.
 */
export default class DarwinRenameThreadController {
    static params_schema = z.object({
        project_id: z.string().min(1),
        thread_id: z.string().min(1),
    });

    static body_schema = z.object({
        title: z.string().trim().min(1).max(200),
    });

    static async process(req: Request, res: Response) {
        try {
            const params = DarwinRenameThreadController.params_schema.safeParse(req.params);
            const body = DarwinRenameThreadController.body_schema.safeParse(req.body);
            if (!params.success || !body.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const resolved = await resolve_darwin_context(req, params.data.project_id);
            if (!resolved.ok) {
                reject_darwin_context(res, resolved);
                return;
            }

            const thread = await DarwinThreadService.rename(
                params.data.thread_id,
                resolved.ctx.projectId,
                resolved.ctx.userId,
                body.data.title,
            );
            if (!thread) {
                ResponseWriter.not_found(res, "Conversation not found");
                return;
            }

            ResponseWriter.success(res, thread, "Conversation renamed successfully");
        } catch (err) {
            console.error("DarwinRenameThreadController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
