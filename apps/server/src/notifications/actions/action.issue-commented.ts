import { NotificationType, prisma } from "@trydarwin/database";
import { type NotificationJobData, to_plain_text } from "@trydarwin/types";

import { MESSAGE_REFERENCE_INCLUDE } from "../../services/service.message-references";
import NotificationCreateService from "../service.notification-create";

type IssueCommentedJobData = Extract<NotificationJobData, { action: "issue.commented" }>;

export default class IssueCommentedNotification {
    static async handle(data: IssueCommentedJobData) {
        const chat = await prisma.chat.findUnique({
            where: { id: data.chatId },
            select: {
                message: true,
                issueId: true,
                isDeleted: true,
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
        if (!chat || chat.isDeleted) return;

        const sender = await prisma.user.findUnique({
            where: { id: data.senderId },
            select: { name: true, email: true },
        });
        if (!sender) return;

        await NotificationCreateService.create({
            scope: "project",
            userId: data.recipientId,
            projectId: chat.issue.projectId,
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
                message: to_plain_text(chat.message, chat.references),
            },
        });
    }
}
