import { prisma, NotificationType } from "@trymatcha/database";
import type { NotificationJobData } from "@trymatcha/types";
import NotificationCreateService from "../service.notification-create";

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

        await NotificationCreateService.create({
            scope: "member",
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
        });
    }
}
