import type { Request, Response } from "express";
import z from "zod";

import IssueService, { ISSUE_PATCH_SCHEMA } from "../../services/service.issue";
import ResponseWriter from "../../services/service.response";

export default class IssueUpdateController {
    static body_scheam = ISSUE_PATCH_SCHEMA;

    static params_schema = z.object({
        id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success: params_success } =
            IssueUpdateController.params_schema.safeParse(req.params);
        if (!params_success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const { data: body_data, success: body_success } =
            IssueUpdateController.body_scheam.safeParse(req.body);
        if (!body_success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const result = await IssueService.update_issue(user, params_data.id, body_data);

            if (!result.ok) {
                if (result.reason === "not_found") {
                    ResponseWriter.not_found(res, "Issue not found");
                    return;
                }
                if (result.reason === "forbidden") {
                    ResponseWriter.not_authorized(res, "You dont have access to the project");
                    return;
                }
                ResponseWriter.invalid_data(res, result.message);
                return;
            }

            ResponseWriter.success(res, { issue: result.issue }, "Issue updated");
        } catch (error) {
            console.error("IssueUpdateController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
