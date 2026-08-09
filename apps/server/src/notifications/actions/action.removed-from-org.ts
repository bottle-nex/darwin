import { prisma, NotificationType } from "@trymatcha/database";
import { OutboundSocketMessageType, type NotificationJobData } from "@trymatcha/types";
import { sendRemovedFromScopeEmail } from "../../services/service.email";
import { server_services } from "../..";

type RemovedFromOrgJobData = Extract<NotificationJobData, { action: "member.removed_from_org" }>;

export default class RemovedFromOrgNotification {
    static async handle(data: RemovedFromOrgJobData) {
        const organization = await prisma.organization.findUnique({
            where: { id: data.orgId },
            select: { name: true, slug: true },
        });
        if (!organization) return;

        const [actor, recipient] = await Promise.all([
            prisma.user.findUnique({
                where: { id: data.actorId },
                select: { name: true, email: true },
            }),
            prisma.user.findUnique({ where: { id: data.recipientId }, select: { email: true } }),
        ]);
        if (!actor || !recipient) return;

        const actorName = actor.name ?? actor.email;

        const notification = await prisma.notification.create({
            data: {
                userId: data.recipientId,
                type: NotificationType.RemovedFromOrg,
                payload: {
                    orgId: data.orgId,
                    orgName: organization.name,
                    orgSlug: organization.slug,
                    actorId: data.actorId,
                    actorName,
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

        await sendRemovedFromScopeEmail(recipient.email, {
            actorName,
            scopeType: "organization",
            scopeName: organization.name,
        });
    }
}
