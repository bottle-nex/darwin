import type { Request, Response } from "express";
import z from "zod";

import IssueReopenService, { REOPEN_SCHEMA } from "../../services/service.issue-reopen";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    id: z.string().min(1),
});

export default class IssueReopenController {
    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params, success: params_ok } = params_schema.safeParse(req.params);
        const { data: body, success: body_ok } = REOPEN_SCHEMA.safeParse(req.body);
        if (!params_ok || !body_ok) {
            ResponseWriter.invalid_data(res, "Say what needs to change before reopening");
            return;
        }

        try {
            const result = await IssueReopenService.reopen_issue(user, params.id, body.note);

            if (!result.ok) {
                if (result.reason === "not_found") {
                    ResponseWriter.not_found(res, result.message);
                    return;
                }
                if (result.reason === "forbidden") {
                    ResponseWriter.not_authorized(res, result.message);
                    return;
                }
                ResponseWriter.custom(res, false, "REOPEN_NOT_ALLOWED", result.message, 409);
                return;
            }

            ResponseWriter.success(res, { issue: result.issue }, "Issue reopened");
        } catch (error) {
            console.error("IssueReopenController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
