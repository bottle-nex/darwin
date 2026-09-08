import { IssueStatus, NotificationType, prisma } from "@trydarwin/database";
import type { NotificationJobData } from "@trydarwin/types";

import { ENV } from "../../configs/env";
import { sendIssueFailedEmail } from "../../services/service.email";
import NotificationCreateService from "../service.notification-create";

type IssueStatusChangedJobData = Extract<NotificationJobData, { action: "issue.status_changed" }>;

export default class IssueStatusChangedNotification {
    static async handle(data: IssueStatusChangedJobData) {
        const issue = await prisma.issue.findUnique({
            where: { id: data.issueId },
            select: {
                title: true,
                number: true,
                projectId: true,
                project: {
                    select: { name: true, slug: true, organization: { select: { slug: true } } },
                },
            },
        });
        if (!issue) return;

        const [actor, recipient] = await Promise.all([
            prisma.user.findUnique({
                where: { id: data.actorId },
                select: { name: true, email: true },
            }),
            prisma.user.findUnique({
                where: { id: data.recipientId },
                select: { email: true },
            }),
        ]);
        if (!actor || !recipient) return;

        const actorName = actor.name ?? actor.email;
        const orgSlug = issue.project.organization.slug;
        const projectSlug = issue.project.slug;

        await NotificationCreateService.create({
            scope: "project",
            userId: data.recipientId,
            projectId: issue.projectId,
            type: NotificationType.IssueStatusChanged,
            payload: {
                issueId: data.issueId,
                issueTitle: issue.title,
                issueNumber: issue.number,
                projectId: issue.projectId,
                projectSlug,
                orgSlug,
                actorId: data.actorId,
                actorName,
                fromStatus: data.fromStatus,
                toStatus: data.toStatus,
            },
        });

        if (data.toStatus !== IssueStatus.Failed) return;

        const url = `${ENV.SERVER_WEB_URL}/playground/${orgSlug}/${projectSlug}/issue/${data.issueId}`;
        await sendIssueFailedEmail(recipient.email, {
            issueTitle: issue.title,
            projectName: issue.project.name,
            url,
        });
    }
}
