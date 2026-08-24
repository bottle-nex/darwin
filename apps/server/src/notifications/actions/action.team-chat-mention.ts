import { NotificationType, prisma } from "@trymatcha/database";
import { type NotificationJobData, to_plain_text } from "@trymatcha/types";

import { ENV } from "../../configs/env";
import { sendMentionEmail } from "../../services/service.email";
import { MESSAGE_REFERENCE_INCLUDE } from "../../services/service.message-references";
import NotificationCreateService from "../service.notification-create";

type TeamChatMentionJobData = Extract<NotificationJobData, { action: "team_chat.mention" }>;

export default class TeamChatMentionNotification {
    static async handle(data: TeamChatMentionJobData) {
        const chat = await prisma.teamChat.findUnique({
            where: { id: data.teamChatId },
            select: {
                message: true,
                teamId: true,
                references: { include: MESSAGE_REFERENCE_INCLUDE },
                team: {
                    select: {
                        name: true,
                        project: {
                            select: {
                                id: true,
                                slug: true,
                                organization: { select: { slug: true } },
                            },
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

        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId: chat.teamId, userId: member.userId } },
            select: { id: true },
        });
        if (!membership) return;

        const senderName = sender.name ?? sender.email;
        const message = to_plain_text(chat.message, chat.references);
        const orgSlug = chat.team.project.organization.slug;
        const projectSlug = chat.team.project.slug;
        const url = `${ENV.SERVER_WEB_URL}/playground/${orgSlug}/${projectSlug}?tab=chats&teamChat=${chat.teamId}`;
        await NotificationCreateService.create({
            scope: "project",
            userId: member.userId,
            projectId: chat.team.project.id,
            type: NotificationType.TeamChatMention,
            payload: {
                teamChatId: data.teamChatId,
                teamId: chat.teamId,
                teamName: chat.team.name,
                projectId: chat.team.project.id,
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
