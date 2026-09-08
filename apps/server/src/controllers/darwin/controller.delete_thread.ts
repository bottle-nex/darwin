import type { Request, Response } from "express";
import z from "zod";

import DarwinThreadService from "../../services/darwin/service.darwin_thread";
import ResponseWriter from "../../services/service.response";
import { reject_darwin_context, resolve_darwin_context } from "./darwin.context";

/**
 * `DELETE /darwin/threads/:project_id/:thread_id` — drop a conversation and its history.
 *
 * Responses: 401 · 400 INVALID_DATA · 404 · 200.
 */
export default class DarwinDeleteThreadController {
    static params_schema = z.object({
        project_id: z.string().min(1),
        thread_id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const params = DarwinDeleteThreadController.params_schema.safeParse(req.params);
            if (!params.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const resolved = await resolve_darwin_context(req, params.data.project_id);
            if (!resolved.ok) {
                reject_darwin_context(res, resolved);
                return;
            }

            const deleted = await DarwinThreadService.remove(
                params.data.thread_id,
                resolved.ctx.projectId,
                resolved.ctx.userId,
            );
            if (!deleted) {
                ResponseWriter.not_found(res, "Conversation not found");
                return;
            }

            ResponseWriter.success(res, null, "Conversation deleted successfully");
        } catch (err) {
            console.error("DarwinDeleteThreadController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
