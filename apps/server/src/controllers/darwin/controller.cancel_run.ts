import type { Request, Response } from "express";
import z from "zod";

import DarwinRunSocketHandler from "../../real-time/darwin-run.handler";
import DarwinRunner from "../../services/darwin/service.darwin_runner";
import ResponseWriter from "../../services/service.response";
import { reject_darwin_context, resolve_darwin_context } from "./darwin.context";

/**
 * `POST /darwin/runs/:run_id/cancel` — stop an answer mid-flight.
 *
 * `stopped: false` means the run finished on its own, or it is owned by another server instance.
 * The second case is the known single-instance limitation noted on {@link DarwinRunner.cancel}.
 *
 * Responses: 401 · 400 INVALID_DATA · 404 · 200 `{ stopped }`.
 */
export default class DarwinCancelRunController {
    static params_schema = z.object({
        run_id: z.string().min(1),
    });

    static body_schema = z.object({
        project_id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const params = DarwinCancelRunController.params_schema.safeParse(req.params);
            const body = DarwinCancelRunController.body_schema.safeParse(req.body);
            if (!params.success || !body.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const resolved = await resolve_darwin_context(req, body.data.project_id);
            if (!resolved.ok) {
                reject_darwin_context(res, resolved);
                return;
            }

            const owned = await DarwinRunSocketHandler.belongs_to(
                params.data.run_id,
                resolved.ctx.projectId,
                resolved.ctx.userId,
            );
            if (!owned) {
                ResponseWriter.not_found(res, "Run not found");
                return;
            }

            ResponseWriter.success(
                res,
                { stopped: DarwinRunner.cancel(params.data.run_id) },
                "Darwin stopped",
            );
        } catch (err) {
            console.error("DarwinCancelRunController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
