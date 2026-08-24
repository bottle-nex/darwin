import { Action, Permissions } from "@trymatcha/access-control";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ChatHistoryService, {
    InvalidChatHistoryCursorError,
} from "../../services/service.chat-history";
import ResponseWriter from "../../services/service.response";

export default class ProjectChatGetController {
    static params_schema = z.object({
        projectId: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const params = ProjectChatGetController.params_schema.safeParse(req.params);
            const query = ChatHistoryService.query_schema.safeParse(req.query);
            if (!params.success || !query.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const role = await Access.project(user.id, params.data.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this project");
                return;
            }

            const page = await ChatHistoryService.list_project_chats(
                params.data.projectId,
                user.id,
                query.data,
            );
            ResponseWriter.success(res, page, "Project chats fetched successfully");
        } catch (err) {
            if (err instanceof InvalidChatHistoryCursorError) {
                ResponseWriter.invalid_data(res, "Invalid cursor");
                return;
            }
            console.error("ProjectChatGetController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
