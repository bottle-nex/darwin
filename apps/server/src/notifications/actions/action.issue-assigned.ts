import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { ENV } from "../../configs/env";
import { sendIssueAssignedEmail } from "../../services/service.email";
import { server_services } from "../..";

type IssueAssignedJobData = Extract<NotificationJobData, { action: "issue.assigned" }>;

export default class IssueAssignedNotification {
    static async handle(data: IssueAssignedJobData) {
        const issue = await prisma.issue.findUnique({
            where: { id: data.issueId },
            select: { title: true, projectId: true, project: { select: { name: true } } },
        });
        if (!issue) return;

        const [actor, assignee] = await Promise.all([
            prisma.user.findUnique({
                where: { id: data.actorId },
                select: { name: true, email: true },
            }),
            prisma.user.findUnique({
                where: { id: data.assigneeId },
                select: { name: true, email: true },
            }),
        ]);
        if (!actor || !assignee) return;

        const actorName = actor.name ?? actor.email;
        const url = `${ENV.SERVER_WEB_URL}/playground/${issue.projectId}?issue=${data.issueId}`;

        const notification = await prisma.notification.create({
            data: {
                userId: data.assigneeId,
                type: NotificationType.IssueAssigned,
                payload: {
                    issueId: data.issueId,
                    issueTitle: issue.title,
                    projectId: issue.projectId,
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

        await sendIssueAssignedEmail(assignee.email, {
            actorName,
            issueTitle: issue.title,
            projectName: issue.project.name,
            url,
        });
    }
}
