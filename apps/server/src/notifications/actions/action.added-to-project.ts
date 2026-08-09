import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { server_services } from "../..";

type AddedToProjectJobData = Extract<NotificationJobData, { action: "member.added_to_project" }>;

export default class AddedToProjectNotification {
    static async handle(data: AddedToProjectJobData) {
        const project = await prisma.project.findUnique({
            where: { id: data.projectId },
            select: {
                name: true,
                slug: true,
                organization: { select: { id: true, name: true, slug: true } },
            },
        });
        if (!project) return;

        const actor = await prisma.user.findUnique({
            where: { id: data.actorId },
            select: { name: true, email: true },
        });
        if (!actor) return;

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
                type: NotificationType.AddedToProject,
                payload: {
                    projectId: data.projectId,
                    projectName: project.name,
                    projectSlug: project.slug,
                    orgId: project.organization.id,
                    orgName: project.organization.name,
                    orgSlug: project.organization.slug,
                    role: data.role,
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
