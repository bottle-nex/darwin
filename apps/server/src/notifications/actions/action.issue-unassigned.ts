import { NotificationType, prisma } from "@trydarwin/database";
import type { NotificationJobData } from "@trydarwin/types";

import NotificationCreateService from "../service.notification-create";

type IssueUnassignedJobData = Extract<NotificationJobData, { action: "issue.unassigned" }>;

export default class IssueUnassignedNotification {
    static async handle(data: IssueUnassignedJobData) {
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

        const actorName = actor.name ?? actor.email;

        await NotificationCreateService.create({
            scope: "project",
            userId: data.assigneeId,
            projectId: issue.projectId,
            type: NotificationType.IssueUnassigned,
            payload: {
                issueId: data.issueId,
                issueTitle: issue.title,
                issueNumber: issue.number,
                projectId: issue.projectId,
                projectSlug: issue.project.slug,
                orgSlug: issue.project.organization.slug,
                actorId: data.actorId,
                actorName,
            },
        });
    }
}
