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

type ProjectChatMentionJobData = Extract<NotificationJobData, { action: "project_chat.mention" }>;

export default class ProjectChatMentionNotification {
    static async handle(data: ProjectChatMentionJobData) {
        const chat = await prisma.projectChat.findUnique({
            where: { id: data.projectChatId },
            select: {
                message: true,
                projectId: true,
                references: { include: MESSAGE_REFERENCE_INCLUDE },
                project: { select: { slug: true, organization: { select: { slug: true } } } },
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
        const orgSlug = chat.project.organization.slug;
        const projectSlug = chat.project.slug;
        const url = `${ENV.SERVER_WEB_URL}/playground/${orgSlug}/${projectSlug}?tab=chats`;

        const notification = await prisma.notification.create({
            data: {
                userId: member.userId,
                type: NotificationType.ProjectChatMention,
                payload: {
                    projectChatId: data.projectChatId,
                    projectId: chat.projectId,
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
