import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { server_services } from "../..";

type RoleChangedJobData = Extract<NotificationJobData, { action: "member.role_changed" }>;

export default class RoleChangedNotification {
    static async handle(data: RoleChangedJobData) {
        const team = await prisma.team.findUnique({
            where: { id: data.teamId },
            select: {
                name: true,
                projectId: true,
                project: { select: { slug: true, organization: { select: { slug: true } } } },
            },
        });
        if (!team) return;

        const actor = await prisma.user.findUnique({
            where: { id: data.actorId },
            select: { name: true, email: true },
        });
        if (!actor) return;

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
                type: NotificationType.RoleChanged,
                payload: {
                    teamId: data.teamId,
                    teamName: team.name,
                    projectId: team.projectId,
                    projectSlug: team.project.slug,
                    orgSlug: team.project.organization.slug,
                    role: data.role,
                    previousRole: data.previousRole,
                    actorId: data.actorId,
                    actorName: actor.name ?? actor.email,
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
