import { NotificationType, prisma } from "@trydarwin/database";
import { type NotificationJobData, to_plain_text } from "@trydarwin/types";

import { ENV } from "../../configs/env";
import { sendMentionEmail } from "../../services/service.email";
import { MESSAGE_REFERENCE_INCLUDE } from "../../services/service.message-references";
import NotificationCreateService from "../service.notification-create";

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

        await NotificationCreateService.create({
            scope: "project",
            userId: member.userId,
            projectId: chat.projectId,
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
        });

        await sendMentionEmail(member.user.email, { senderName, message, url });
    }
}
