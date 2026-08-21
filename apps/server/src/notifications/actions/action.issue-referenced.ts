import { prisma, NotificationType } from "@trymatcha/database";
import {
    OutboundSocketMessageType,
    to_plain_text,
    type LabelledReference,
    type NotificationJobData,
} from "@trymatcha/types";
import { MESSAGE_REFERENCE_INCLUDE } from "../../services/service.message-references";
import { server_services } from "../..";

type IssueReferencedJobData = Extract<NotificationJobData, { action: "issue.referenced" }>;

type ReferencingMessage = {
    message: string;
    isDeleted: boolean;
    references: LabelledReference[];
};

export default class IssueReferencedNotification {
    static async handle(data: IssueReferencedJobData) {
        const source = await IssueReferencedNotification.find_source(data);
        if (!source || source.isDeleted) return;

        const [issue, actor] = await Promise.all([
            prisma.issue.findUnique({
                where: { id: data.issueId },
                select: {
                    title: true,
                    number: true,
                    projectId: true,
                    project: { select: { slug: true, organization: { select: { slug: true } } } },
                },
            }),
            prisma.user.findUnique({
                where: { id: data.actorId },
                select: { name: true, email: true },
            }),
        ]);
        if (!issue || !actor) return;

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
                type: NotificationType.IssueReferenced,
                payload: {
                    issueId: data.issueId,
                    issueTitle: issue.title,
                    issueNumber: issue.number,
                    projectId: issue.projectId,
                    projectSlug: issue.project.slug,
                    orgSlug: issue.project.organization.slug,
                    senderId: data.actorId,
                    senderName: actor.name ?? actor.email,
                    message: to_plain_text(source.message, source.references),
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

    private static async find_source(
        data: IssueReferencedJobData,
    ): Promise<ReferencingMessage | null> {
        const select = {
            message: true,
            isDeleted: true,
            references: { include: MESSAGE_REFERENCE_INCLUDE },
        };

        if (data.chatId) {
            return prisma.chat.findUnique({ where: { id: data.chatId }, select });
        }
        if (data.projectChatId) {
            return prisma.projectChat.findUnique({ where: { id: data.projectChatId }, select });
        }
        if (data.teamChatId) {
            return prisma.teamChat.findUnique({ where: { id: data.teamChatId }, select });
        }
        return null;
    }
}
