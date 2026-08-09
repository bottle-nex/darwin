import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { server_services } from "../..";

type IssueMovedJobData = Extract<NotificationJobData, { action: "issue.moved" }>;

export default class IssueMovedNotification {
    static async handle(data: IssueMovedJobData) {
        const issue = await prisma.issue.findUnique({
            where: { id: data.issueId },
            select: {
                title: true,
                number: true,
                projectId: true,
                project: { select: { slug: true, organization: { select: { slug: true } } } },
            },
        });
        if (!issue) return;

        const actor = await prisma.user.findUnique({
            where: { id: data.actorId },
            select: { name: true, email: true },
        });
        if (!actor) return;

        const column = data.toColumnId
            ? await prisma.customColumn.findUnique({
                  where: { id: data.toColumnId },
                  select: { label: true },
              })
            : null;

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
                type: NotificationType.IssueMoved,
                payload: {
                    issueId: data.issueId,
                    issueTitle: issue.title,
                    issueNumber: issue.number,
                    projectId: issue.projectId,
                    projectSlug: issue.project.slug,
                    orgSlug: issue.project.organization.slug,
                    actorId: data.actorId,
                    actorName: actor.name ?? actor.email,
                    toColumnLabel: column?.label ?? null,
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
