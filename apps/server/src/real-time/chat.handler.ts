import { WebSocket } from "ws";
import z from "zod";
import { prisma } from "@trymatcha/database";
import Access from "../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { server_services } from "..";
import { OutboundSocketMessageType } from "@trymatcha/types";
import type { AuthUser } from "../types/express.d";

export default class ChatSocketHandler {
    static payload_schema = z.object({
        issueId: z.string().min(1),
        message: z.string().trim().min(1).max(5000),
        mentionedMemberIds: z.array(z.string().min(1)).max(20).optional(),
        repliedToId: z.string().min(1).optional(),
    });

    static delete_payload_schema = z.object({
        chatId: z.string().min(1),
    });

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
            ChatSocketHandler.send_error(ws, "Invalid chat data provided");
            return;
        }
        const { issueId, message, mentionedMemberIds, repliedToId } = parsed.data;

        try {
            const issue = await prisma.issue.findUnique({
                where: { id: issueId },
                select: { id: true, projectId: true },
            });
            if (!issue || issue.projectId !== project_id) {
                ChatSocketHandler.send_error(ws, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ChatSocketHandler.send_error(ws, "You dont have access to this project");
                return;
            }

            if (repliedToId) {
                const replied_to = await prisma.chat.findUnique({
                    where: { id: repliedToId },
                    select: { issueId: true },
                });
                if (!replied_to || replied_to.issueId !== issue.id) {
                    ChatSocketHandler.send_error(ws, "Replied message not found");
                    return;
                }
            }

            // Mentions are scoped to ProjectMember, so a tagged id only sticks if it's
            // actually a member of this issue's project — silently drop the rest.
            const mention_ids = mentionedMemberIds?.length
                ? (
                      await prisma.projectMember.findMany({
                          where: { id: { in: mentionedMemberIds }, projectId: issue.projectId },
                          select: { id: true },
                      })
                  ).map((member) => member.id)
                : [];

            const chat = await prisma.chat.create({
                data: {
                    issueId: issue.id,
                    senderId: user.id,
                    message,
                    repliedToId,
                    mentions: { create: mention_ids.map((memberId) => ({ memberId })) },
                },
                include: {
                    sender: true,
                    repliedTo: { include: { sender: true } },
                    mentions: { include: { member: { include: { user: true } } } },
                },
            });

            const channel_name = server_services.publisher.get_channel_name(issue.projectId);
            const publish_body = {
                type: OutboundSocketMessageType.CHAT_CREATED,
                projectId: issue.projectId,
                payload: chat,
            };
            await server_services.publisher.publish_message(
                channel_name,
                JSON.stringify(publish_body),
            );

            // Notify tagged members, excluding whoever mentioned themselves.
            await Promise.all(
                chat.mentions
                    .filter((mention) => mention.member.userId !== user.id)
                    .map((mention) =>
                        server_services.notifications.enqueue({
                            action: "chat.mention",
                            chatId: chat.id,
                            memberId: mention.memberId,
                            mentionedById: user.id,
                        }),
                    ),
            );
        } catch (error) {
            console.error("ChatSocketHandler error: ", error);
            ChatSocketHandler.send_error(ws, "Something went wrong");
        }
    }

    private static send_error(ws: WebSocket, message: string) {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: OutboundSocketMessageType.CHAT_ERROR, message }));
    }
}
