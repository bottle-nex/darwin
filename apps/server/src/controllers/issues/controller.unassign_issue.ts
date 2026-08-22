import { Request, Response } from "express";
import z from "zod";
import { ActivityType, ActorType, prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { server_services } from "../..";
import ActivityService from "../../services/service.activity";

export default class IssueUnassignController {
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
                select: {
                    projectId: true,
                    assignees: {
                        where: { id: target_user_id },
                        select: { id: true, name: true, image: true },
                    },
                },
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

            // Anyone may drop themselves, removing someone else needs the assign permission.
            if (
                target_user_id !== user.id &&
                !Permissions.project(role, Action.project.assign_issue)
            ) {
                ResponseWriter.not_authorized(res, "You dont have permission to unassign issues");
                return;
            }

            const removed = issue.assignees[0];

            // `disconnect` is idempotent, removing an user who isn't assigned is a no-op.
            const { updated, activities } = await prisma.$transaction(async (tx) => {
                const updated = await tx.issue.update({
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
                        prUrl: true,
                        prNumber: true,
                        prTitle: true,
                        assignees: { select: { id: true, name: true, email: true, image: true } },
                        tags: { select: { id: true, name: true, color: true } },
                    },
                });

                const activities = removed
                    ? await ActivityService.emit(tx, {
                          issueId: issue_id,
                          actor: { type: ActorType.User, userId: user.id, name: user.name },
                          events: [
                              { type: ActivityType.AssigneeRemoved, payload: { user: removed } },
                          ],
                      })
                    : [];

                return { updated, activities };
            });

            await ActivityService.publish(issue.projectId, issue_id, activities);

            // Dropping yourself doesn't need to notify yourself.
            if (target_user_id !== user.id) {
                await server_services.notifications.enqueue({
                    action: "issue.unassigned",
                    issueId: issue_id,
                    assigneeId: target_user_id,
                    actorId: user.id,
                });
            }

            ResponseWriter.success(res, { issue: updated }, "Issue unassigned");
        } catch (error) {
            ResponseWriter.system_error(res);
        }
    }
}
