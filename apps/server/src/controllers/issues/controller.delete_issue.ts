import { Request, Response } from "express";
import z from "zod";
import { prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";

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
            const issue = await prisma.issue.findUnique({
                where: {
                    id: params_data.id,
                },
                select: {
                    projectId: true,
                },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.close_issue)) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            await prisma.issue.delete({
                where: {
                    id: params_data.id,
                },
            });

            ResponseWriter.success(res, { ok: true }, "Issue deleted");
        } catch (error) {
            ResponseWriter.system_error(res);
        }
    }
}
