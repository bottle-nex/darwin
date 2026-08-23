import { prisma, NotificationType } from "@trymatcha/database";
import type { NotificationJobData } from "@trymatcha/types";
import { sendRemovedFromScopeEmail } from "../../services/service.email";
import NotificationCreateService from "../service.notification-create";

type RemovedFromTeamJobData = Extract<NotificationJobData, { action: "member.removed_from_team" }>;

export default class RemovedFromTeamNotification {
    static async handle(data: RemovedFromTeamJobData) {
        const team = await prisma.team.findUnique({
            where: { id: data.teamId },
            select: {
                name: true,
                projectId: true,
                project: {
                    select: { slug: true, organization: { select: { name: true, slug: true } } },
                },
            },
        });
        if (!team) return;

        const [actor, recipient] = await Promise.all([
            prisma.user.findUnique({
                where: { id: data.actorId },
                select: { name: true, email: true },
            }),
            prisma.user.findUnique({ where: { id: data.recipientId }, select: { email: true } }),
        ]);
        if (!actor || !recipient) return;

        const actorName = actor.name ?? actor.email;

        await NotificationCreateService.create({
            scope: "member",
            userId: data.recipientId,
            type: NotificationType.RemovedFromTeam,
            payload: {
                teamId: data.teamId,
                teamName: team.name,
                projectId: team.projectId,
                projectSlug: team.project.slug,
                orgName: team.project.organization.name,
                orgSlug: team.project.organization.slug,
                actorId: data.actorId,
                actorName,
            },
        });

        await sendRemovedFromScopeEmail(recipient.email, {
            actorName,
            scopeType: "team",
            scopeName: team.name,
        });
    }
}
