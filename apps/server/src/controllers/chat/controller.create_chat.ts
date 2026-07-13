import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import { prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { server_services } from "../..";
import { OutboundSocketMessageType } from "@trymatcha/types";

export default class ChatCreateController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static body_schema = z.object({
        message: z.string().trim().min(1).max(5000),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }
        try {
            const parsed_params = ChatCreateController.params_schema.safeParse(req.params);
            const parsed_body = ChatCreateController.body_schema.safeParse(req.body);
            if (!parsed_params.success || !parsed_body.success) {
                ResponseWriter.invalid_data(res, "Invalid comment data provided");
                return;
            }

            const issue = await prisma.issue.findUnique({
                where: {
                    id: parsed_params.data.id,
                },
                select: {
                    id: true,
                    projectId: true,
                },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this project");
                return;
            }

            const chat = await prisma.chat.create({
                data: {
                    issueId: issue.id,
                    senderId: user.id,
                    message: parsed_body.data.message,
                },
                include: {
                    sender: true,
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

            ResponseWriter.created(res, { chat }, "Comment added successfully");
        } catch (error) {
            console.error("ChatCreateController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
