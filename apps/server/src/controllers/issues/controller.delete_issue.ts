import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import IssueService from "../../services/service.issue";

export default class IssueDeleteController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success } = IssueDeleteController.params_schema.safeParse(
            req.params,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const result = await IssueService.delete_issue(user, params_data.id);

            if (!result.ok) {
                if (result.reason === "not_found") {
                    ResponseWriter.not_found(res, "Issue not found");
                    return;
                }
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            ResponseWriter.success(res, { ok: true }, "Issue deleted");
        } catch (error) {
            console.error("IssueDeleteController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
