import { NotificationType, prisma } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { server_services } from "../..";

type MessageReactedJobData = Extract<NotificationJobData, { action: "message.reacted" }>;

export default class MessageReactedNotification {
    static async handle(data: MessageReactedJobData) {
        const [actor, chat] = await Promise.all([
            prisma.user.findUnique({
                where: { id: data.actorId },
                select: { name: true, email: true },
            }),
            data.chatId
                ? prisma.chat.findUnique({
                      where: { id: data.chatId },
                      select: {
                          id: true,
                          issueId: true,
                          isDeleted: true,
                          issue: {
                              select: {
                                  title: true,
                                  number: true,
                                  projectId: true,
                                  project: {
                                      select: {
                                          slug: true,
                                          organization: { select: { slug: true } },
                                      },
                                  },
                              },
                          },
                      },
                  })
                : null,
        ]);
        if (!actor) return;

        if (chat && !chat.isDeleted) {
            const notification = await prisma.notification.create({
                data: {
                    userId: data.recipientId,
                    type: NotificationType.MessageReacted,
                    payload: {
                        chatId: chat.id,
                        issueId: chat.issueId,
                        issueTitle: chat.issue.title,
                        issueNumber: chat.issue.number,
                        projectId: chat.issue.projectId,
                        projectSlug: chat.issue.project.slug,
                        orgSlug: chat.issue.project.organization.slug,
                        actorId: data.actorId,
                        actorName: actor.name ?? actor.email,
                        emoji: data.emoji,
                    },
                },
            });
            await MessageReactedNotification.publish(notification);
            return;
        }

        if (!data.projectChatId) return;
        const project_chat = await prisma.projectChat.findUnique({
            where: { id: data.projectChatId },
            select: {
                id: true,
                isDeleted: true,
                projectId: true,
                project: {
                    select: { slug: true, organization: { select: { slug: true } } },
                },
            },
        });
        if (!project_chat || project_chat.isDeleted) return;

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
                type: NotificationType.MessageReacted,
                payload: {
                    projectChatId: project_chat.id,
                    projectId: project_chat.projectId,
                    projectSlug: project_chat.project.slug,
                    orgSlug: project_chat.project.organization.slug,
                    actorId: data.actorId,
                    actorName: actor.name ?? actor.email,
                    emoji: data.emoji,
                },
            },
        });
        await MessageReactedNotification.publish(notification);
    }

    private static async publish(notification: { id: string; userId: string }) {
        await server_services.publisher.publish_message(
            server_services.publisher.get_user_channel_name(notification.userId),
            JSON.stringify({
                type: OutboundSocketMessageType.NOTIFICATION_CREATED,
                payload: notification,
            }),
        );
    }
}
