import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import { OutboundSocketMessageType } from "@trydarwin/types";
import { WebSocket } from "ws";
import z from "zod";

import { server_services } from "..";
import Access from "../access-control/access";
import type { CommentFailureReason } from "../services/service.issue-comment";
import IssueCommentService from "../services/service.issue-comment";
import MessageReactionService from "../services/service.message-reactions";
import type { AuthUser } from "../types/express.d";
import { pending_operation_id, reaction_payload_schema } from "./reaction.payload";

const COMMENT_ERRORS: Record<CommentFailureReason, string> = {
    issue_not_found: "Issue not found",
    forbidden: "You dont have access to this project",
    reply_not_found: "Replied message not found",
    empty_message: "Message is empty",
};

export default class ChatSocketHandler {
    static payload_schema = z.object({
        issueId: z.string().min(1),
        message: z.string().trim().min(1).max(5000),
        repliedToId: z.string().min(1).optional(),
        operationId: z.string().uuid(),
    });

    static delete_payload_schema = z.object({
        chatId: z.string().min(1),
    });

    static async handle_chat_reaction(
        ws: WebSocket,
        user: AuthUser,
        project_id: string,
        raw_payload: unknown,
    ) {
        const parsed = reaction_payload_schema.safeParse(raw_payload);
        if (!parsed.success) {
            ChatSocketHandler.send_error(
                ws,
                "Invalid reaction data provided",
                pending_operation_id(raw_payload),
            );
            return;
        }
        const { chatId, emoji, operationId } = parsed.data;

        try {
            const chat = await prisma.chat.findUnique({
                where: { id: chatId },
                select: {
                    id: true,
                    senderId: true,
                    isDeleted: true,
                    issue: { select: { projectId: true } },
                },
            });
            if (!chat || chat.issue.projectId !== project_id || chat.isDeleted) {
                ChatSocketHandler.send_error(ws, "Message not found", operationId);
                return;
            }

            const role = await Access.project(user.id, project_id);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ChatSocketHandler.send_error(
                    ws,
                    "You dont have access to this project",
                    operationId,
                );
                return;
            }

            const mutation = await MessageReactionService.change_chat_reaction(
                chat.id,
                user.id,
                emoji,
            );
            const channel_name = server_services.publisher.get_channel_name(project_id);
            await server_services.publisher.publish_message(
                channel_name,
                JSON.stringify({
                    type: OutboundSocketMessageType.CHAT_REACTION_UPDATED,
                    projectId: project_id,
                    payload: {
                        chatId: chat.id,
                        updates: mutation.updates,
                        actorId: user.id,
                        operationId,
                    },
                }),
            );

            if (mutation.reactionId && chat.senderId && chat.senderId !== user.id) {
                await server_services.notifications.enqueue({
                    action: "message.reacted",
                    reactionId: mutation.reactionId,
                    recipientId: chat.senderId,
                    actorId: user.id,
                    emoji,
                    chatId: chat.id,
                });
            }
        } catch (error) {
            console.error("Chat reaction error: ", error);
            ChatSocketHandler.send_error(ws, "Something went wrong", operationId);
        }
    }

    static async handle_chat_delete(
        ws: WebSocket,
        user: AuthUser,
        project_id: string,
        raw_payload: unknown,
    ) {
        const parsed = ChatSocketHandler.delete_payload_schema.safeParse(raw_payload);
        if (!parsed.success) {
            ChatSocketHandler.send_error(ws, "Invalid chat data provided");
            return;
        }
        const { chatId } = parsed.data;

        try {
            const chat = await prisma.chat.findUnique({
                where: { id: chatId },
                select: {
                    id: true,
                    senderId: true,
                    isDeleted: true,
                    issue: { select: { projectId: true } },
                },
            });
            if (!chat || chat.issue.projectId !== project_id) {
                ChatSocketHandler.send_error(ws, "Message not found");
                return;
            }

            const role = await Access.project(user.id, project_id);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ChatSocketHandler.send_error(ws, "You dont have access to this project");
                return;
            }

            const is_author = chat.senderId !== null && chat.senderId === user.id;
            if (!is_author && !Permissions.project(role, Action.project.delete_any_chat)) {
                ChatSocketHandler.send_error(ws, "You cannot delete this message");
                return;
            }

            if (chat.isDeleted) return;

            const deleted = await prisma.chat.update({
                where: { id: chat.id },
                data: { isDeleted: true },
                include: {
                    sender: true,
                    repliedTo: { include: { sender: true } },
                },
            });

            const channel_name = server_services.publisher.get_channel_name(project_id);
            const publish_body = {
                type: OutboundSocketMessageType.CHAT_DELETED,
                projectId: project_id,
                payload: deleted,
            };
            await server_services.publisher.publish_message(
                channel_name,
                JSON.stringify(publish_body),
            );
        } catch (error) {
            console.error("ChatSocketHandler error: ", error);
            ChatSocketHandler.send_error(ws, "Something went wrong");
        }
    }

    static async handle_chat_create(
        ws: WebSocket,
        user: AuthUser,
        project_id: string,
        raw_payload: unknown,
    ) {
        const parsed = ChatSocketHandler.payload_schema.safeParse(raw_payload);
        if (!parsed.success) {
            ChatSocketHandler.send_error(
                ws,
                "Invalid chat data provided",
                pending_operation_id(raw_payload),
            );
            return;
        }
        const { issueId, message, repliedToId, operationId } = parsed.data;

        try {
            const result = await IssueCommentService.create({
                issueId,
                projectId: project_id,
                actorId: user.id,
                message,
                repliedToId,
                operationId,
            });
            if (!result.ok) {
                ChatSocketHandler.send_error(ws, COMMENT_ERRORS[result.reason], operationId);
            }
        } catch (error) {
            console.error("ChatSocketHandler error: ", error);
            ChatSocketHandler.send_error(ws, "Something went wrong", operationId);
        }
    }

    private static send_error(ws: WebSocket, message: string, operationId?: string) {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(
            JSON.stringify({ type: OutboundSocketMessageType.CHAT_ERROR, message, operationId }),
        );
    }
}
