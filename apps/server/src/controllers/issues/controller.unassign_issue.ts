import { Request, Response } from "express";
import z from "zod";
import { prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";

export default class IssueUnassignController {
    // Both ids come from the URL: /issues/:id/assignees/:user_id
    static params_schema = z.object({
        id: z.string().min(1),
        user_id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success } = IssueUnassignController.params_schema.safeParse(
            req.params,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const issue_id = params_data.id;
        const target_user_id = params_data.user_id;

        try {
            const issue = await prisma.issue.findUnique({
                where: { id: issue_id },
                select: { projectId: true },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            // Anyone may drop themselves; removing someone else needs the assign permission.
            if (
                target_user_id !== user.id &&
                !Permissions.project(role, Action.project.assign_issue)
            ) {
                ResponseWriter.not_authorized(res, "You dont have permission to unassign issues");
                return;
            }

            // `disconnect` is idempotent — removing a user who isn't assigned is a no-op.
            const updated = await prisma.issue.update({
                where: { id: issue_id },
                data: { assignees: { disconnect: { id: target_user_id } } },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    description: true,
                    priority: true,
                    status: true,
                    customColumnId: true,
                    createdAt: true,
                    startDate: true,
                    targetDate: true,
                    assignees: { select: { id: true, name: true, email: true, image: true } },
                    tags: { select: { id: true, name: true, color: true } },
                },
            });

            ResponseWriter.success(res, { issue: updated }, "Issue unassigned");
        } catch (error) {
            ResponseWriter.system_error(res);
        }
    }
}
