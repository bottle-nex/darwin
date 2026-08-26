import { NotificationType, prisma } from "@trymatcha/database";
import type { NotificationJobData } from "@trymatcha/types";

import NotificationCreateService from "../service.notification-create";

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

        await NotificationCreateService.create({
            scope: "member",
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
        });
    }
}
