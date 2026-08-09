import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { server_services } from "../..";

type InviteAcceptedJobData = Extract<NotificationJobData, { action: "invite.accepted" }>;

export default class InviteAcceptedNotification {
    static async handle(data: InviteAcceptedJobData) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: data.invitationId },
            select: {
                orgId: true,
                organization: { select: { name: true, slug: true } },
                project: { select: { id: true, name: true, slug: true } },
                team: { select: { id: true, name: true } },
            },
        });
        if (!invitation) return;

        const accepter = await prisma.user.findUnique({
            where: { id: data.accepterId },
            select: { name: true, email: true },
        });
        if (!accepter) return;

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
                type: NotificationType.InviteAccepted,
                payload: {
                    invitationId: data.invitationId,
                    orgId: invitation.orgId,
                    orgName: invitation.organization.name,
                    orgSlug: invitation.organization.slug,
                    projectId: invitation.project?.id ?? null,
                    projectName: invitation.project?.name ?? null,
                    projectSlug: invitation.project?.slug ?? null,
                    teamId: invitation.team?.id ?? null,
                    teamName: invitation.team?.name ?? null,
                    accepterId: data.accepterId,
                    accepterName: accepter.name ?? accepter.email,
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
