import { NotificationType, prisma } from "@trymatcha/database";
import type { NotificationJobData } from "@trymatcha/types";

import NotificationCreateService from "../service.notification-create";

type IssueDeletedJobData = Extract<NotificationJobData, { action: "issue.deleted" }>;

export default class IssueDeletedNotification {
    static async handle(data: IssueDeletedJobData) {
        const actor = await prisma.user.findUnique({
            where: { id: data.actorId },
            select: { name: true, email: true },
        });
        if (!actor) return;

        await NotificationCreateService.create({
            scope: "project",
            userId: data.recipientId,
            projectId: data.projectId,
            type: NotificationType.IssueDeleted,
            payload: {
                issueId: data.issueId,
                issueTitle: data.issueTitle,
                issueNumber: data.issueNumber,
                projectId: data.projectId,
                projectSlug: data.projectSlug,
                orgSlug: data.orgSlug,
                actorId: data.actorId,
                actorName: actor.name ?? actor.email,
            },
        });
    }
}
