import type { Request, Response } from "express";
import z from "zod";

import DarwinThreadService from "../../services/darwin/service.darwin_thread";
import ResponseWriter from "../../services/service.response";
import { reject_darwin_context, resolve_darwin_context } from "./darwin.context";

/**
 * `GET /darwin/threads/:project_id` — the caller's own Darwin conversations, newest first.
 *
 * Responses: 401 · 400 INVALID_DATA · 200 `DarwinThreadSummary[]`.
 */
export default class DarwinListThreadsController {
    static params_schema = z.object({
        project_id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const params = DarwinListThreadsController.params_schema.safeParse(req.params);
            if (!params.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const resolved = await resolve_darwin_context(req, params.data.project_id);
            if (!resolved.ok) {
                reject_darwin_context(res, resolved);
                return;
            }

            const threads = await DarwinThreadService.list(
                resolved.ctx.projectId,
                resolved.ctx.userId,
            );
            ResponseWriter.success(res, threads, "Conversations fetched successfully");
        } catch (err) {
            console.error("DarwinListThreadsController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
