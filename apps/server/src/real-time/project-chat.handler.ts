import { WebSocket } from "ws";
import z from "zod";
import { prisma } from "@trymatcha/database";
import Access from "../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { server_services } from "..";
import { OutboundSocketMessageType } from "@trymatcha/types";
import MessageReferenceService, {
    MESSAGE_REFERENCE_INCLUDE,
} from "../services/service.message-references";
import type { AuthUser } from "../types/express.d";

export default class ProjectChatSocketHandler {
    static payload_schema = z.object({
        message: z.string().trim().min(1).max(5000),
        repliedToId: z.string().min(1).optional(),
    });

    static delete_payload_schema = z.object({
        chatId: z.string().min(1),
    });

    static async handle_project_chat_delete(
        ws: WebSocket,
        user: AuthUser,
        project_id: string,
        raw_payload: unknown,
    ) {
        const parsed = ProjectChatSocketHandler.delete_payload_schema.safeParse(raw_payload);
        if (!parsed.success) {
            ProjectChatSocketHandler.send_error(ws, "Invalid chat data provided");
            return;
        }
        const { chatId } = parsed.data;

        try {
            const chat = await prisma.projectChat.findUnique({
                where: { id: chatId },
                select: {
                    id: true,
                    senderId: true,
                    isDeleted: true,
                    projectId: true,
                },
            });
            if (!chat || chat.projectId !== project_id) {
                ProjectChatSocketHandler.send_error(ws, "Message not found");
                return;
            }

            const role = await Access.project(user.id, project_id);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ProjectChatSocketHandler.send_error(ws, "You dont have access to this project");
                return;
            }

            const is_author = chat.senderId !== null && chat.senderId === user.id;
            if (!is_author && !Permissions.project(role, Action.project.delete_any_chat)) {
                ProjectChatSocketHandler.send_error(ws, "You cannot delete this message");
                return;
            }

            if (chat.isDeleted) return;

            const deleted = await prisma.projectChat.update({
                where: { id: chat.id },
                data: { isDeleted: true },
                include: {
                    sender: true,
                    repliedTo: { include: { sender: true } },
                },
            });

            const channel_name = server_services.publisher.get_channel_name(project_id);
            const publish_body = {
                type: OutboundSocketMessageType.PROJECT_CHAT_DELETED,
                projectId: project_id,
                payload: deleted,
            };
            await server_services.publisher.publish_message(
                channel_name,
                JSON.stringify(publish_body),
            );
        } catch (error) {
            console.error("ProjectChatSocketHandler error: ", error);
            ProjectChatSocketHandler.send_error(ws, "Something went wrong");
        }
    }

    static async handle_project_chat_create(
        ws: WebSocket,
        user: AuthUser,
        project_id: string,
        raw_payload: unknown,
    ) {
        const parsed = ProjectChatSocketHandler.payload_schema.safeParse(raw_payload);
        if (!parsed.success) {
            ProjectChatSocketHandler.send_error(ws, "Invalid chat data provided");
            return;
        }
        const { message, repliedToId } = parsed.data;
        try {
            const role = await Access.project(user.id, project_id);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ProjectChatSocketHandler.send_error(ws, "You dont have access to this project");
                return;
            }

            if (repliedToId) {
                const replied_to = await prisma.projectChat.findUnique({
                    where: { id: repliedToId },
                    select: { projectId: true },
                });
                if (!replied_to || replied_to.projectId !== project_id) {
                    ProjectChatSocketHandler.send_error(ws, "Replied message not found");
                    return;
                }
            }

            const resolved = await MessageReferenceService.resolve(message, project_id);
            if (!resolved.message) {
                ProjectChatSocketHandler.send_error(ws, "Message is empty");
                return;
            }

            const chat = await prisma.projectChat.create({
                data: {
                    projectId: project_id,
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

            const channel_name = server_services.publisher.get_channel_name(project_id);
            const publish_body = {
                type: OutboundSocketMessageType.PROJECT_CHAT_CREATED,
                projectId: project_id,
                payload: chat,
            };
            await server_services.publisher.publish_message(
                channel_name,
                JSON.stringify(publish_body),
            );

            const mentioned_user_ids = chat.references.flatMap((reference) =>
                reference.member ? [reference.member.userId] : [],
            );

            // Notify tagged members, excluding whoever mentioned themselves.
            await Promise.all(
                chat.references.flatMap((reference) =>
                    reference.memberId && reference.member?.userId !== user.id
                        ? [
                              server_services.notifications.enqueue({
                                  action: "project_chat.mention",
                                  projectChatId: chat.id,
                                  memberId: reference.memberId,
                                  mentionedById: user.id,
                              }),
                          ]
                        : [],
                ),
            );

            const referenced = await MessageReferenceService.referenced_issue_recipients({
                issueIds: resolved.issueIds,
                exclude: [user.id, ...mentioned_user_ids],
            });

            await Promise.all(
                referenced.map((target) =>
                    server_services.notifications.enqueue({
                        action: "issue.referenced",
                        issueId: target.issueId,
                        projectChatId: chat.id,
                        recipientId: target.recipientId,
                        actorId: user.id,
                    }),
                ),
            );
        } catch (error) {
            console.error("ProjectChatSocketHandler error: ", error);
            ProjectChatSocketHandler.send_error(ws, "Something went wrong");
        }
    }

    private static send_error(ws: WebSocket, message: string) {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: OutboundSocketMessageType.CHAT_ERROR, message }));
    }
}
