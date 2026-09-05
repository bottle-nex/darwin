import { NotificationType, prisma } from "@trymatcha/database";
import { type NotificationJobData, to_plain_text } from "@trymatcha/types";

import DescriptionReferenceService, {
    DESCRIPTION_REFERENCE_INCLUDE,
} from "../../services/service.description-references";
import NotificationCreateService from "../service.notification-create";

type DescriptionMentionJobData = Extract<
    NotificationJobData,
    { action: "issue.description_mention" }
>;

export default class DescriptionMentionNotification {
    static async handle(data: DescriptionMentionJobData) {
        const issue = await prisma.issue.findUnique({
            where: { id: data.issueId },
            select: {
                title: true,
                number: true,
                description: true,
                projectId: true,
                descriptionReferences: { include: DESCRIPTION_REFERENCE_INCLUDE },
                project: {
                    select: { slug: true, organization: { select: { slug: true } } },
                },
            },
        });
        if (!issue) return;

        const [member, sender] = await Promise.all([
            prisma.projectMember.findUnique({
                where: { id: data.memberId },
                select: { userId: true },
            }),
            prisma.user.findUnique({
                where: { id: data.mentionedById },
                select: { name: true, email: true },
            }),
        ]);
        if (!member || !sender) return;

        const orgSlug = issue.project.organization.slug;
        const projectSlug = issue.project.slug;

        await NotificationCreateService.create({
            scope: "project",
            userId: member.userId,
            projectId: issue.projectId,
            type: NotificationType.DescriptionMention,
            payload: {
                issueId: data.issueId,
                issueTitle: issue.title,
                issueNumber: issue.number,
                projectId: issue.projectId,
                projectSlug,
                orgSlug,
                senderId: data.mentionedById,
                senderName: sender.name ?? sender.email,
                message: to_plain_text(
                    issue.description,
                    DescriptionReferenceService.to_labels(issue.descriptionReferences),
                ),
            },
        });
    }
}
