import { WebSocket } from "ws";
import z from "zod";
import { prisma } from "@trymatcha/database";
import Access from "../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { server_services } from "..";
import { OutboundSocketMessageType } from "@trymatcha/types";
import { issue_recipients } from "../notifications/recipients";
import { pending_operation_id, reaction_payload_schema } from "./reaction.payload";
import MessageReferenceService, {
    MESSAGE_REFERENCE_INCLUDE,
} from "../services/service.message-references";
import MessageReactionService from "../services/service.message-reactions";
import type { AuthUser } from "../types/express.d";

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
            const issue = await prisma.issue.findUnique({
                where: { id: issueId },
                select: {
                    id: true,
                    projectId: true,
                    createdById: true,
                    assignees: { select: { id: true } },
                },
            });
            if (!issue || issue.projectId !== project_id) {
                ChatSocketHandler.send_error(ws, "Issue not found", operationId);
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ChatSocketHandler.send_error(
                    ws,
                    "You dont have access to this project",
                    operationId,
                );
                return;
            }

            let thread_root_id: string | undefined;
            if (repliedToId) {
                const replied_to = await prisma.chat.findUnique({
                    where: { id: repliedToId },
                    select: { issueId: true, repliedToId: true },
                });
                if (!replied_to || replied_to.issueId !== issue.id) {
                    ChatSocketHandler.send_error(ws, "Replied message not found", operationId);
                    return;
                }
                thread_root_id = replied_to.repliedToId ?? repliedToId;
            }

            const resolved = await MessageReferenceService.resolve(message, issue.projectId);
            if (!resolved.message) {
                ChatSocketHandler.send_error(ws, "Message is empty", operationId);
                return;
            }

            const chat = await prisma.chat.create({
                data: {
                    issueId: issue.id,
                    senderId: user.id,
                    message: resolved.message,
                    repliedToId: thread_root_id,
                    references: { create: MessageReferenceService.to_rows(resolved) },
                },
                include: {
                    sender: true,
                    repliedTo: { include: { sender: true } },
                    references: { include: MESSAGE_REFERENCE_INCLUDE },
                },
            });

            const channel_name = server_services.publisher.get_channel_name(issue.projectId);
            const publish_body = {
                type: OutboundSocketMessageType.CHAT_CREATED,
                projectId: issue.projectId,
                payload: { ...chat, reactions: [] },
                operationId,
            };
            await server_services.publisher.publish_message(
                channel_name,
                JSON.stringify(publish_body),
            );

            const mentioned_user_ids = chat.references.flatMap((reference) =>
                reference.member ? [reference.member.userId] : [],
            );

            await Promise.all(
                chat.references.flatMap((reference) =>
                    reference.memberId && reference.member?.userId !== user.id
                        ? [
                              server_services.notifications.enqueue({
                                  action: "chat.mention",
                                  chatId: chat.id,
                                  memberId: reference.memberId,
                                  mentionedById: user.id,
                              }),
                          ]
                        : [],
                ),
            );

            const referenced = await MessageReferenceService.referenced_issue_recipients({
                issueIds: resolved.issueIds.filter((id) => id !== issue.id),
                exclude: [user.id, ...mentioned_user_ids],
            });

            await Promise.all(
                referenced.map((target) =>
                    server_services.notifications.enqueue({
                        action: "issue.referenced",
                        issueId: target.issueId,
                        chatId: chat.id,
                        recipientId: target.recipientId,
                        actorId: user.id,
                    }),
                ),
            );

            await Promise.all(
                issue_recipients({
                    assigneeIds: issue.assignees.map((assignee) => assignee.id),
                    creatorId: issue.createdById,
                    exclude: [
                        user.id,
                        ...mentioned_user_ids,
                        ...referenced.map((target) => target.recipientId),
                    ],
                }).map((recipientId) =>
                    server_services.notifications.enqueue({
                        action: "issue.commented",
                        chatId: chat.id,
                        recipientId,
                        senderId: user.id,
                    }),
                ),
            );
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
