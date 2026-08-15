import { prisma, NotificationType } from "@trymatcha/database";
import {
    OutboundSocketMessageType,
    to_plain_text,
    type NotificationJobData,
} from "@trymatcha/types";
import { ENV } from "../../configs/env";
import { sendMentionEmail } from "../../services/service.email";
import { MESSAGE_REFERENCE_INCLUDE } from "../../services/service.message-references";
import { server_services } from "../..";

type ChatMentionJobData = Extract<NotificationJobData, { action: "chat.mention" }>;

export default class ChatMentionNotification {
    static async handle(data: ChatMentionJobData) {
        const chat = await prisma.chat.findUnique({
            where: { id: data.chatId },
            select: {
                message: true,
                issueId: true,
                references: { include: MESSAGE_REFERENCE_INCLUDE },
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
        if (!chat) return;

        const [member, sender] = await Promise.all([
            prisma.projectMember.findUnique({
                where: { id: data.memberId },
                select: { userId: true, user: { select: { email: true } } },
            }),
            prisma.user.findUnique({
                where: { id: data.mentionedById },
                select: { name: true, email: true },
            }),
        ]);
        if (!member || !sender) return;

        const senderName = sender.name ?? sender.email;
        const message = to_plain_text(chat.message, chat.references);
        const projectId = chat.issue.projectId;
        const orgSlug = chat.issue.project.organization.slug;
        const projectSlug = chat.issue.project.slug;
        const url = `${ENV.SERVER_WEB_URL}/playground/${orgSlug}/${projectSlug}?tab=thread-detail&thread=${chat.issueId}`;

        const notification = await prisma.notification.create({
            data: {
                userId: member.userId,
                type: NotificationType.ChatMention,
                payload: {
                    chatId: data.chatId,
                    issueId: chat.issueId,
                    issueTitle: chat.issue.title,
                    issueNumber: chat.issue.number,
                    projectId,
                    projectSlug,
                    orgSlug,
                    senderId: data.mentionedById,
                    senderName,
                    message,
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

        await sendMentionEmail(member.user.email, { senderName, message, url });
    }
}
