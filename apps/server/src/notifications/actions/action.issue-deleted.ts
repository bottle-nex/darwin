import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { server_services } from "../..";

type IssueDeletedJobData = Extract<NotificationJobData, { action: "issue.deleted" }>;

export default class IssueDeletedNotification {
    static async handle(data: IssueDeletedJobData) {
        const actor = await prisma.user.findUnique({
            where: { id: data.actorId },
            select: { name: true, email: true },
        });
        if (!actor) return;

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
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
            },
        });

        await server_services.publisher.publish_message(
            server_services.publisher.get_user_channel_name(notification.userId),
            JSON.stringify({
                type: OutboundSocketMessageType.NOTIFICATION_CREATED,
                payload: notification,
            }),
        );
    }
}
