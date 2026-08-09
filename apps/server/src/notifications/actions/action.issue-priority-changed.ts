import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { server_services } from "../..";

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

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
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
