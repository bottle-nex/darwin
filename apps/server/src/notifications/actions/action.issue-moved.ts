import { NotificationType, prisma } from "@trymatcha/database";
import type { NotificationJobData } from "@trymatcha/types";

import NotificationCreateService from "../service.notification-create";

type IssueMovedJobData = Extract<NotificationJobData, { action: "issue.moved" }>;

export default class IssueMovedNotification {
    static async handle(data: IssueMovedJobData) {
        const issue = await prisma.issue.findUnique({
            where: { id: data.issueId },
            select: {
                title: true,
                number: true,
                projectId: true,
                project: { select: { slug: true, organization: { select: { slug: true } } } },
            },
        });
        if (!issue) return;

        const actor = await prisma.user.findUnique({
            where: { id: data.actorId },
            select: { name: true, email: true },
        });
        if (!actor) return;

        const column = data.toColumnId
            ? await prisma.customColumn.findUnique({
                  where: { id: data.toColumnId },
                  select: { label: true },
              })
            : null;

        await NotificationCreateService.create({
            scope: "project",
            userId: data.recipientId,
            projectId: issue.projectId,
            type: NotificationType.IssueMoved,
            payload: {
                issueId: data.issueId,
                issueTitle: issue.title,
                issueNumber: issue.number,
                projectId: issue.projectId,
                projectSlug: issue.project.slug,
                orgSlug: issue.project.organization.slug,
                actorId: data.actorId,
                actorName: actor.name ?? actor.email,
                toColumnLabel: column?.label ?? null,
            },
        });
    }
}
