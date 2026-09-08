import { NotificationType, prisma } from "@trydarwin/database";
import type { NotificationJobData } from "@trydarwin/types";

import NotificationCreateService from "../service.notification-create";

type AddedToTeamJobData = Extract<NotificationJobData, { action: "member.added_to_team" }>;

export default class AddedToTeamNotification {
    static async handle(data: AddedToTeamJobData) {
        const team = await prisma.team.findUnique({
            where: { id: data.teamId },
            select: {
                name: true,
                projectId: true,
                project: {
                    select: {
                        name: true,
                        slug: true,
                        organization: { select: { name: true, slug: true } },
                    },
                },
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
            type: NotificationType.AddedToTeam,
            payload: {
                teamId: data.teamId,
                teamName: team.name,
                projectId: team.projectId,
                projectName: team.project.name,
                projectSlug: team.project.slug,
                orgName: team.project.organization.name,
                orgSlug: team.project.organization.slug,
                actorId: data.actorId,
                actorName: actor.name ?? actor.email,
            },
        });
    }
}
