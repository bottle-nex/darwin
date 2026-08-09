import { Request, Response } from "express";
import z from "zod";
import { IssueStatus, prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { server_services } from "../..";

export default class IssueAssignController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static body_schema = z.object({
        user_id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success: params_ok } =
            IssueAssignController.params_schema.safeParse(req.params);
        const { data: body_data, success: body_ok } = IssueAssignController.body_schema.safeParse(
            req.body,
        );
        if (!params_ok || !body_ok) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const issue_id = params_data.id;
        const target_user_id = body_data.user_id;

        try {
            const issue = await prisma.issue.findUnique({
                where: { id: issue_id },
                select: { projectId: true, status: true },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            // The requester must be a member of the project at all.
            const role = await Access.project(user.id, issue.projectId);
            if (!role) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            if (target_user_id === user.id) {
                if (issue.status !== IssueStatus.Todo && issue.status !== IssueStatus.Parked) {
                    ResponseWriter.custom(
                        res,
                        false,
                        "PICK_NOT_ALLOWED",
                        "You can only pick issues that are still in To-Do",
                        403,
                    );
                    return;
                }
            } else {
                // Assigning someone else needs the assign permission...
                if (!Permissions.project(role, Action.project.assign_issue)) {
                    ResponseWriter.not_authorized(res, "You dont have permission to assign issues");
                    return;
                }
                // ...and the assignee must themselves be a member of the project.
                const target_role = await Access.project(target_user_id, issue.projectId);
                if (!target_role) {
                    ResponseWriter.invalid_data(res, "User is not a member of this project");
                    return;
                }
            }

            // `connect` is idempotent — re-assigning an already-assigned user is a no-op.
            const updated = await prisma.issue.update({
                where: { id: issue_id },
                data: { assignees: { connect: { id: target_user_id } } },
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

            // Self-assignment (picking a todo) doesn't need to notify yourself.
            if (target_user_id !== user.id) {
                await server_services.notifications.enqueue({
                    action: "issue.assigned",
                    issueId: issue_id,
                    assigneeId: target_user_id,
                    actorId: user.id,
                });
            }

            ResponseWriter.success(res, { issue: updated }, "Issue assigned");
        } catch (error) {
            ResponseWriter.system_error(res);
        }
    }
}
