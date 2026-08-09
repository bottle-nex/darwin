import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { server_services } from "../..";

type IssueCommentedJobData = Extract<NotificationJobData, { action: "issue.commented" }>;

export default class IssueCommentedNotification {
    static async handle(data: IssueCommentedJobData) {
        const chat = await prisma.chat.findUnique({
            where: { id: data.chatId },
            select: {
                message: true,
                issueId: true,
                isDeleted: true,
                issue: {
                    select: {
                        title: true,
                        number: true,
                        projectId: true,
                        project: {
                            select: { slug: true, organization: { select: { slug: true } } },
                        },
                    },
                },
            },
        });
        if (!chat || chat.isDeleted) return;

        const sender = await prisma.user.findUnique({
            where: { id: data.senderId },
            select: { name: true, email: true },
        });
        if (!sender) return;

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
                type: NotificationType.IssueCommented,
                payload: {
                    chatId: data.chatId,
                    issueId: chat.issueId,
                    issueTitle: chat.issue.title,
                    issueNumber: chat.issue.number,
                    projectId: chat.issue.projectId,
                    projectSlug: chat.issue.project.slug,
                    orgSlug: chat.issue.project.organization.slug,
                    senderId: data.senderId,
                    senderName: sender.name ?? sender.email,
                    message: chat.message,
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
