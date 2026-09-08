import { NotificationType, prisma } from "@trydarwin/database";
import type { NotificationJobData } from "@trydarwin/types";

import NotificationCreateService from "../service.notification-create";

type IssuePriorityChangedJobData = Extract<
    NotificationJobData,
    { action: "issue.priority_changed" }
>;

export default class IssuePriorityChangedNotification {
    static async handle(data: IssuePriorityChangedJobData) {
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

        await NotificationCreateService.create({
            scope: "project",
            userId: data.recipientId,
            projectId: issue.projectId,
            type: NotificationType.IssuePriorityChanged,
            payload: {
                issueId: data.issueId,
                issueTitle: issue.title,
                issueNumber: issue.number,
                projectId: issue.projectId,
                projectSlug: issue.project.slug,
                orgSlug: issue.project.organization.slug,
                actorId: data.actorId,
                actorName: actor.name ?? actor.email,
                priority: data.priority,
            },
        });
    }
}
