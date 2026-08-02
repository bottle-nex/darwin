import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { ENV } from "../../configs/env";
import { sendMentionEmail } from "../../services/service.email";
import { server_services } from "../..";

type ChatMentionJobData = Extract<NotificationJobData, { action: "chat.mention" }>;

export default class ChatMentionNotification {
    static async handle(data: ChatMentionJobData) {
        const chat = await prisma.chat.findUnique({
            where: { id: data.chatId },
            select: { message: true, issueId: true, issue: { select: { projectId: true } } },
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
        const projectId = chat.issue.projectId;
        const url = `${ENV.SERVER_WEB_URL}/playground/${projectId}?issue=${chat.issueId}`;

        const notification = await prisma.notification.create({
            data: {
                userId: member.userId,
                type: NotificationType.ChatMention,
                payload: {
                    chatId: data.chatId,
                    issueId: chat.issueId,
                    projectId,
                    senderId: data.mentionedById,
                    senderName,
                    message: chat.message,
                },
            },
        });

        await server_services.publisher.publish_message(
            server_services.publisher.get_channel_name(projectId),
            JSON.stringify({
                type: OutboundSocketMessageType.NOTIFICATION_CREATED,
                projectId,
                payload: notification,
            }),
        );

        await sendMentionEmail(member.user.email, { senderName, message: chat.message, url });
    }
}
