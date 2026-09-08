import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ChatHistoryService, {
    InvalidChatHistoryCursorError,
} from "../../services/service.chat-history";
import ResponseWriter from "../../services/service.response";

export default class ChatGetController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const params = ChatGetController.params_schema.safeParse(req.params);
            const query = ChatHistoryService.query_schema.safeParse(req.query);
            if (!params.success || !query.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const issue = await prisma.issue.findUnique({
                where: { id: params.data.id },
                select: { id: true, projectId: true },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this project");
                return;
            }

            const page = await ChatHistoryService.list_issue_comments(
                issue.id,
                user.id,
                query.data,
            );
            ResponseWriter.success(res, page, "Comments fetched successfully");
        } catch (err) {
            if (err instanceof InvalidChatHistoryCursorError) {
                ResponseWriter.invalid_data(res, "Invalid cursor");
                return;
            }
            console.error("ChatGetController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
