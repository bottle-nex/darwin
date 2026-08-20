import { ActorType, IssueStatus, prisma } from "@trymatcha/database";
import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import DescriptionReferenceService from "../../services/service.description-references";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { issue_recipients } from "../../notifications/recipients";
import { server_services } from "../..";
import { OutboundSocketMessageType } from "@trymatcha/types";
import ActivityService from "../../services/service.activity";
import { diff_issue } from "../../services/service.activity-diff";

export default class IssueUpdateController {
    static body_scheam = z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        priority: z.number().int().min(0).max(4).optional(),
        status: z.enum(IssueStatus).optional(),
        custom_column_id: z.string().nullable().optional(),
        tag_ids: z.array(z.string()).max(20).optional(),
        assignee_ids: z.array(z.string()).max(20).optional(),
        start_date: z.union([z.null(), z.coerce.date()]).optional(),
        target_date: z.union([z.null(), z.coerce.date()]).optional(),
    });

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

        const id = params_data.id;

        const { data: body_data, success: body_success } =
            IssueUpdateController.body_scheam.safeParse(req.body);
        if (!body_success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const issue = await prisma.issue.findUnique({
                where: {
                    id,
                },
                select: {
                    projectId: true,
                    status: true,
                    priority: true,
                    title: true,
                    description: true,
                    startDate: true,
                    targetDate: true,
                    customColumnId: true,
                    customColumn: { select: { id: true, label: true } },
                    createdById: true,
                    assignees: { select: { id: true, name: true, image: true } },
                    tags: { select: { id: true, name: true, color: true } },
                },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }
            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.triage_issue)) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            if (body_data.custom_column_id) {
                const column = await prisma.customColumn.findFirst({
                    where: { id: body_data.custom_column_id, projectId: issue.projectId },
                    select: { id: true },
                });
                if (!column) {
                    ResponseWriter.invalid_data(res, "Column not found in this project");
                    return;
                }
            }

            if (body_data.tag_ids?.length) {
                const tag_count = await prisma.tag.count({
                    where: { id: { in: body_data.tag_ids }, projectId: issue.projectId },
                });
                if (tag_count !== body_data.tag_ids.length) {
                    ResponseWriter.invalid_data(res, "One or more tags are not in this project");
                    return;
                }
            }

            if (body_data.assignee_ids?.length) {
                const assignee_roles = await Promise.all(
                    body_data.assignee_ids.map((id) => Access.project(id, issue.projectId)),
                );
                if (assignee_roles.some((assignee_role) => !assignee_role)) {
                    ResponseWriter.invalid_data(
                        res,
                        "One or more assignees are not project members",
                    );
                    return;
                }
            }

            const next_column_id =
                body_data.custom_column_id !== undefined
                    ? body_data.custom_column_id
                    : issue.customColumnId;

            let next_status: IssueStatus;
            if (next_column_id !== null) {
                next_status = IssueStatus.Parked;
            } else if (body_data.status && body_data.status !== IssueStatus.Parked) {
                next_status = body_data.status;
            } else if (issue.status === IssueStatus.Parked) {
                next_status = IssueStatus.Todo;
            } else {
                next_status = issue.status;
            }

            const references =
                body_data.description !== undefined
                    ? await DescriptionReferenceService.resolve(
                          body_data.description,
                          issue.projectId,
                      )
                    : null;

            const { updated, activities } = await prisma.$transaction(async (tx) => {
                const updated = await tx.issue.update({
                    where: { id },
                    data: {
                        title: body_data.title,
                        description: references ? references.message : undefined,
                        priority: body_data.priority,
                        status: next_status,
                        customColumnId: next_column_id,
                        startDate: body_data.start_date,
                        targetDate: body_data.target_date,
                        tags: body_data.tag_ids
                            ? { set: body_data.tag_ids.map((id) => ({ id })) }
                            : undefined,
                        assignees: body_data.assignee_ids
                            ? { set: body_data.assignee_ids.map((id) => ({ id })) }
                            : undefined,
                    },
                    include: {
                        creator: true,
                        assignees: true,
                        tags: true,
                        customColumn: { select: { id: true, label: true } },
                    },
                });

                const activities = await ActivityService.emit(tx, {
                    issueId: id,
                    actor: { type: ActorType.User, userId: user.id, name: user.name },
                    events: diff_issue(issue, updated),
                });

                return { updated, activities };
            });

            if (references) await DescriptionReferenceService.write(id, references);

            const channel_name = server_services.publisher.get_channel_name(issue.projectId);
            await server_services.publisher.publish_message(
                channel_name,
                JSON.stringify({
                    type: OutboundSocketMessageType.ISSUE_UPDATED,
                    projectId: issue.projectId,
                    payload: updated,
                }),
            );
            await ActivityService.publish(issue.projectId, id, activities);

            await IssueUpdateController.notify(
                user.id,
                issue,
                updated,
                next_status,
                next_column_id,
            );

            ResponseWriter.success(res, { issue: updated }, "Issue updated");
        } catch (error) {
            console.error("IssueUpdateController error: ", error);
            ResponseWriter.system_error(res);
        }
    }

    private static async notify(
        actor_id: string,
        before: {
            status: IssueStatus;
            priority: number;
            customColumnId: string | null;
            createdById: string;
            assignees: { id: string }[];
        },
        after: { id: string; priority: number; assignees: { id: string }[] },
        next_status: IssueStatus,
        next_column_id: string | null,
    ) {
        const before_assignees = new Set(before.assignees.map((assignee) => assignee.id));
        const after_assignees = new Set(after.assignees.map((assignee) => assignee.id));

        for (const assignee_id of after_assignees) {
            if (assignee_id === actor_id || before_assignees.has(assignee_id)) continue;
            await server_services.notifications.enqueue({
                action: "issue.assigned",
                issueId: after.id,
                assigneeId: assignee_id,
                actorId: actor_id,
            });
        }

        for (const assignee_id of before_assignees) {
            if (assignee_id === actor_id || after_assignees.has(assignee_id)) continue;
            await server_services.notifications.enqueue({
                action: "issue.unassigned",
                issueId: after.id,
                assigneeId: assignee_id,
                actorId: actor_id,
            });
        }

        const recipients = issue_recipients({
            assigneeIds: [...after_assignees],
            creatorId: before.createdById,
            exclude: [actor_id],
        });

        const column_changed = next_column_id !== before.customColumnId;

        if (column_changed) {
            for (const recipient_id of recipients) {
                await server_services.notifications.enqueue({
                    action: "issue.moved",
                    issueId: after.id,
                    recipientId: recipient_id,
                    actorId: actor_id,
                    toColumnId: next_column_id,
                });
            }
        } else if (next_status !== before.status) {
            for (const recipient_id of recipients) {
                await server_services.notifications.enqueue({
                    action: "issue.status_changed",
                    issueId: after.id,
                    recipientId: recipient_id,
                    actorId: actor_id,
                    fromStatus: before.status,
                    toStatus: next_status,
                });
            }
        }

        if (after.priority === 1 && before.priority !== 1) {
            for (const assignee_id of after_assignees) {
                if (assignee_id === actor_id) continue;
                await server_services.notifications.enqueue({
                    action: "issue.priority_changed",
                    issueId: after.id,
                    recipientId: assignee_id,
                    actorId: actor_id,
                    priority: after.priority,
                });
            }
        }
    }
}
