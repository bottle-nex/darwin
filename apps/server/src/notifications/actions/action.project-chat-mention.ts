import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { ENV } from "../../configs/env";
import { sendMentionEmail } from "../../services/service.email";
import { server_services } from "../..";

type ProjectChatMentionJobData = Extract<NotificationJobData, { action: "project_chat.mention" }>;

export default class ProjectChatMentionNotification {
    static async handle(data: ProjectChatMentionJobData) {
        const chat = await prisma.projectChat.findUnique({
            where: { id: data.projectChatId },
            select: { message: true, projectId: true },
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
        const url = `${ENV.SERVER_WEB_URL}/playground/${chat.projectId}`;

        const notification = await prisma.notification.create({
            data: {
                userId: member.userId,
                type: NotificationType.ProjectChatMention,
                payload: {
                    projectChatId: data.projectChatId,
                    projectId: chat.projectId,
                    senderId: data.mentionedById,
                    senderName,
                    message: chat.message,
                },
            },
        });

        await server_services.publisher.publish_message(
            server_services.publisher.get_channel_name(chat.projectId),
            JSON.stringify({
                type: OutboundSocketMessageType.NOTIFICATION_CREATED,
                projectId: chat.projectId,
                payload: notification,
            }),
        );

        await sendMentionEmail(member.user.email, { senderName, message: chat.message, url });
    }
}
