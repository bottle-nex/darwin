import { WebSocket } from "ws";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import { OutboundSocketMessageType, type TeamRole } from "@trymatcha/types";
import { server_services } from "..";
import MessageReactionService from "../services/service.message-reactions";
import MessageReferenceService, {
    MESSAGE_REFERENCE_INCLUDE,
} from "../services/service.message-references";
import type { AuthUser } from "../types/express.d";
import { pending_operation_id, reaction_payload_schema } from "./reaction.payload";

type TeamContext = {
    projectId: string;
    role: TeamRole;
    userIds: string[];
};

export default class TeamChatSocketHandler {
    static payload_schema = z.object({
        teamId: z.string().min(1),
        message: z.string().trim().min(1).max(5000),
        repliedToId: z.string().min(1).optional(),
        operationId: z.string().uuid(),
    });

    static delete_payload_schema = z.object({
        chatId: z.string().min(1),
    });

    static async handle_team_chat_reaction(
        ws: WebSocket,
        user: AuthUser,
        project_id: string,
        raw_payload: unknown,
    ) {
        const parsed = reaction_payload_schema.safeParse(raw_payload);
        if (!parsed.success) {
            TeamChatSocketHandler.send_error(
                ws,
                "Invalid reaction data provided",
                pending_operation_id(raw_payload),
            );
            return;
        }
        const { chatId, emoji, operationId } = parsed.data;

        try {
            const chat = await prisma.teamChat.findUnique({
                where: { id: chatId },
                select: { id: true, senderId: true, isDeleted: true, teamId: true },
            });
            if (!chat || chat.isDeleted) {
                TeamChatSocketHandler.send_error(ws, "Message not found", operationId);
                return;
            }

            const context = await TeamChatSocketHandler.team_context(chat.teamId, user.id);
            if (
                !context ||
                context.projectId !== project_id ||
                !Permissions.team(context.role, Action.team.read)
            ) {
                TeamChatSocketHandler.send_error(
                    ws,
                    "You dont have access to this team",
                    operationId,
                );
                return;
            }

            const mutation = await MessageReactionService.change_team_chat_reaction(
                chat.id,
                user.id,
                emoji,
            );
            await TeamChatSocketHandler.publish_to_members(
                context.userIds,
                JSON.stringify({
                    type: OutboundSocketMessageType.TEAM_CHAT_REACTION_UPDATED,
                    projectId: project_id,
                    teamId: chat.teamId,
                    payload: {
                        chatId: chat.id,
                        updates: mutation.updates,
                        actorId: user.id,
                        operationId,
                    },
                }),
            );

            if (
                mutation.reactionId &&
                chat.senderId &&
                chat.senderId !== user.id &&
                context.userIds.includes(chat.senderId)
            ) {
                await server_services.notifications.enqueue({
                    action: "message.reacted",
                    reactionId: mutation.reactionId,
                    recipientId: chat.senderId,
                    actorId: user.id,
                    emoji,
                    teamChatId: chat.id,
                });
            }
        } catch (error) {
            console.error("Team chat reaction error: ", error);
            TeamChatSocketHandler.send_error(ws, "Something went wrong", operationId);
        }
    }

    static async handle_team_chat_delete(
        ws: WebSocket,
        user: AuthUser,
        project_id: string,
        raw_payload: unknown,
    ) {
        const parsed = TeamChatSocketHandler.delete_payload_schema.safeParse(raw_payload);
        if (!parsed.success) {
            TeamChatSocketHandler.send_error(ws, "Invalid chat data provided");
            return;
        }

        try {
            const chat = await prisma.teamChat.findUnique({
                where: { id: parsed.data.chatId },
                select: { id: true, senderId: true, isDeleted: true, teamId: true },
            });
            if (!chat) {
                TeamChatSocketHandler.send_error(ws, "Message not found");
                return;
            }

            const context = await TeamChatSocketHandler.team_context(chat.teamId, user.id);
            if (
                !context ||
                context.projectId !== project_id ||
                !Permissions.team(context.role, Action.team.read)
            ) {
                TeamChatSocketHandler.send_error(ws, "You dont have access to this team");
                return;
            }

            const is_author = chat.senderId === user.id;
            if (!is_author && !Permissions.team(context.role, Action.team.delete_any_chat)) {
                TeamChatSocketHandler.send_error(ws, "You cannot delete this message");
                return;
            }
            if (chat.isDeleted) return;

            const deleted = await prisma.teamChat.update({
                where: { id: chat.id },
                data: { isDeleted: true },
                include: {
                    sender: true,
                    repliedTo: { include: { sender: true } },
                    references: { include: MESSAGE_REFERENCE_INCLUDE },
                },
            });
            await TeamChatSocketHandler.publish_to_members(
                context.userIds,
                JSON.stringify({
                    type: OutboundSocketMessageType.TEAM_CHAT_DELETED,
                    projectId: project_id,
                    teamId: chat.teamId,
                    payload: { ...deleted, reactions: [] },
                }),
            );
        } catch (error) {
            console.error("TeamChatSocketHandler error: ", error);
            TeamChatSocketHandler.send_error(ws, "Something went wrong");
        }
    }

    static async handle_team_chat_create(
        ws: WebSocket,
        user: AuthUser,
        project_id: string,
        raw_payload: unknown,
    ) {
        const parsed = TeamChatSocketHandler.payload_schema.safeParse(raw_payload);
        if (!parsed.success) {
            TeamChatSocketHandler.send_error(
                ws,
                "Invalid chat data provided",
                pending_operation_id(raw_payload),
            );
            return;
        }
        const { teamId, message, repliedToId, operationId } = parsed.data;

        try {
            const context = await TeamChatSocketHandler.team_context(teamId, user.id);
            if (
                !context ||
                context.projectId !== project_id ||
                !Permissions.team(context.role, Action.team.read)
            ) {
                TeamChatSocketHandler.send_error(
                    ws,
                    "You dont have access to this team",
                    operationId,
                );
                return;
            }

            if (repliedToId) {
                const replied_to = await prisma.teamChat.findUnique({
                    where: { id: repliedToId },
                    select: { teamId: true },
                });
                if (!replied_to || replied_to.teamId !== teamId) {
                    TeamChatSocketHandler.send_error(ws, "Replied message not found", operationId);
                    return;
                }
            }

            const resolved = await MessageReferenceService.resolve(message, project_id, teamId);
            if (!resolved.message) {
                TeamChatSocketHandler.send_error(ws, "Message is empty", operationId);
                return;
            }

            const chat = await prisma.teamChat.create({
                data: {
                    teamId,
                    senderId: user.id,
                    message: resolved.message,
                    repliedToId,
                    references: { create: MessageReferenceService.to_rows(resolved) },
                },
                include: {
                    sender: true,
                    repliedTo: { include: { sender: true } },
                    references: { include: MESSAGE_REFERENCE_INCLUDE },
                },
            });
            await TeamChatSocketHandler.publish_to_members(
                context.userIds,
                JSON.stringify({
                    type: OutboundSocketMessageType.TEAM_CHAT_CREATED,
                    projectId: project_id,
                    teamId,
                    payload: { ...chat, reactions: [] },
                    operationId,
                }),
            );

            const mentioned_user_ids = chat.references.flatMap((reference) =>
                reference.member ? [reference.member.userId] : [],
            );
            await Promise.all(
                chat.references.flatMap((reference) =>
                    reference.memberId && reference.member?.userId !== user.id
                        ? [
                              server_services.notifications.enqueue({
                                  action: "team_chat.mention",
                                  teamChatId: chat.id,
                                  memberId: reference.memberId,
                                  mentionedById: user.id,
                              }),
                          ]
                        : [],
                ),
            );

            const team_user_ids = new Set(context.userIds);
            const referenced = await MessageReferenceService.referenced_issue_recipients({
                issueIds: resolved.issueIds,
                exclude: [user.id, ...mentioned_user_ids],
            });
            await Promise.all(
                referenced
                    .filter((target) => team_user_ids.has(target.recipientId))
                    .map((target) =>
                        server_services.notifications.enqueue({
                            action: "issue.referenced",
                            issueId: target.issueId,
                            teamChatId: chat.id,
                            recipientId: target.recipientId,
                            actorId: user.id,
                        }),
                    ),
            );
        } catch (error) {
            console.error("TeamChatSocketHandler error: ", error);
            TeamChatSocketHandler.send_error(ws, "Something went wrong", operationId);
        }
    }

    private static async team_context(
        team_id: string,
        user_id: string,
    ): Promise<TeamContext | null> {
        const team = await prisma.team.findUnique({
            where: { id: team_id },
            select: {
                projectId: true,
                members: { select: { userId: true, role: true } },
            },
        });
        const member = team?.members.find((candidate) => candidate.userId === user_id);
        if (!team || !member) return null;
        return {
            projectId: team.projectId,
            role: member.role,
            userIds: [...new Set(team.members.map((team_member) => team_member.userId))],
        };
    }

    private static async publish_to_members(user_ids: string[], message: string) {
        await Promise.all(
            user_ids.map((user_id) =>
                server_services.publisher.publish_message(
                    server_services.publisher.get_user_channel_name(user_id),
                    message,
                ),
            ),
        );
    }

    private static send_error(ws: WebSocket, message: string, operationId?: string) {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(
            JSON.stringify({ type: OutboundSocketMessageType.CHAT_ERROR, message, operationId }),
        );
    }
}
