import { NotificationType, prisma } from "@trymatcha/database";
import type { NotificationJobData } from "@trymatcha/types";
import NotificationCreateService from "../service.notification-create";

type MessageReactedJobData = Extract<NotificationJobData, { action: "message.reacted" }>;

export default class MessageReactedNotification {
    static async handle(data: MessageReactedJobData) {
        const [actor, chat] = await Promise.all([
            prisma.user.findUnique({
                where: { id: data.actorId },
                select: { name: true, email: true },
            }),
            data.chatId
                ? prisma.chat.findUnique({
                      where: { id: data.chatId },
                      select: {
                          id: true,
                          issueId: true,
                          isDeleted: true,
                          issue: {
                              select: {
                                  title: true,
                                  number: true,
                                  projectId: true,
                                  project: {
                                      select: {
                                          slug: true,
                                          organization: { select: { slug: true } },
                                      },
                                  },
                              },
                          },
                      },
                  })
                : null,
        ]);
        if (!actor) return;

        if (chat && !chat.isDeleted) {
            await NotificationCreateService.create({
                scope: "project",
                userId: data.recipientId,
                projectId: chat.issue.projectId,
                type: NotificationType.MessageReacted,
                payload: {
                    chatId: chat.id,
                    issueId: chat.issueId,
                    issueTitle: chat.issue.title,
                    issueNumber: chat.issue.number,
                    projectId: chat.issue.projectId,
                    projectSlug: chat.issue.project.slug,
                    orgSlug: chat.issue.project.organization.slug,
                    actorId: data.actorId,
                    actorName: actor.name ?? actor.email,
                    emoji: data.emoji,
                },
            });
            return;
        }

        if (data.projectChatId) {
            const project_chat = await prisma.projectChat.findUnique({
                where: { id: data.projectChatId },
                select: {
                    id: true,
                    isDeleted: true,
                    projectId: true,
                    project: {
                        select: { slug: true, organization: { select: { slug: true } } },
                    },
                },
            });
            if (!project_chat || project_chat.isDeleted) return;

            await NotificationCreateService.create({
                scope: "project",
                userId: data.recipientId,
                projectId: project_chat.projectId,
                type: NotificationType.MessageReacted,
                payload: {
                    projectChatId: project_chat.id,
                    projectId: project_chat.projectId,
                    projectSlug: project_chat.project.slug,
                    orgSlug: project_chat.project.organization.slug,
                    actorId: data.actorId,
                    actorName: actor.name ?? actor.email,
                    emoji: data.emoji,
                },
            });
            return;
        }

        if (!data.teamChatId) return;
        const team_chat = await prisma.teamChat.findUnique({
            where: { id: data.teamChatId },
            select: {
                id: true,
                isDeleted: true,
                teamId: true,
                team: {
                    select: {
                        name: true,
                        project: {
                            select: {
                                id: true,
                                slug: true,
                                organization: { select: { slug: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!team_chat || team_chat.isDeleted) return;

        const membership = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: { teamId: team_chat.teamId, userId: data.recipientId },
            },
            select: { id: true },
        });
        if (!membership) return;

        await NotificationCreateService.create({
            scope: "project",
            userId: data.recipientId,
            projectId: team_chat.team.project.id,
            type: NotificationType.MessageReacted,
            payload: {
                teamChatId: team_chat.id,
                teamId: team_chat.teamId,
                teamName: team_chat.team.name,
                projectId: team_chat.team.project.id,
                projectSlug: team_chat.team.project.slug,
                orgSlug: team_chat.team.project.organization.slug,
                actorId: data.actorId,
                actorName: actor.name ?? actor.email,
                emoji: data.emoji,
            },
        });
    }
}
