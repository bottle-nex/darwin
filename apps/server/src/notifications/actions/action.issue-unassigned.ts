import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { server_services } from "../..";

type IssueUnassignedJobData = Extract<NotificationJobData, { action: "issue.unassigned" }>;

/**
 * Unlike {@link IssueAssignedNotification}, this doesn't send an email — being dropped from
 * an issue isn't actionable enough to warrant an inbox ping, just a persisted record and a
 * live badge update for anyone with the project open.
 */
export default class IssueUnassignedNotification {
    static async handle(data: IssueUnassignedJobData) {
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

        const actorName = actor.name ?? actor.email;

        const notification = await prisma.notification.create({
            data: {
                userId: data.assigneeId,
                type: NotificationType.IssueUnassigned,
                payload: {
                    issueId: data.issueId,
                    issueTitle: issue.title,
                    issueNumber: issue.number,
                    projectId: issue.projectId,
                    projectSlug: issue.project.slug,
                    orgSlug: issue.project.organization.slug,
                    actorId: data.actorId,
                    actorName,
                },
            },
        });

        await server_services.publisher.publish_message(
            server_services.publisher.get_channel_name(issue.projectId),
            JSON.stringify({
                type: OutboundSocketMessageType.NOTIFICATION_CREATED,
                projectId: issue.projectId,
                payload: notification,
            }),
        );
    }
}
