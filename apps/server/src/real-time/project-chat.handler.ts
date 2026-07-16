import { WebSocket } from "ws";
import z from "zod";
import { prisma } from "@trymatcha/database";
import Access from "../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { server_services } from "..";
import { OutboundSocketMessageType } from "@trymatcha/types";
import type { AuthUser } from "../types/express.d";

export default class ProjectChatSocketHandler {
    static payload_schema = z.object({
        message: z.string().trim().min(1).max(5000),
        repliedToId: z.string().min(1).optional(),
    });

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

            const chat = await prisma.projectChat.create({
                data: {
                    projectId: project_id,
                    senderId: user.id,
                    message,
                    repliedToId,
                },
                include: {
                    sender: true,
                    repliedTo: { include: { sender: true } },
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
