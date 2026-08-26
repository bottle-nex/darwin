import { Action, Permissions } from "@trymatcha/access-control";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ChatHistoryService, {
    InvalidChatHistoryCursorError,
} from "../../services/service.chat-history";
import ResponseWriter from "../../services/service.response";

export default class TeamChatGetController {
    static params_schema = z.object({
        teamId: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user?.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const params = TeamChatGetController.params_schema.safeParse(req.params);
            const query = ChatHistoryService.query_schema.safeParse(req.query);
            if (!params.success || !query.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const role = await Access.team(user.id, params.data.teamId);
            if (!role || !Permissions.team(role, Action.team.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this team");
                return;
            }

            const page = await ChatHistoryService.list_team_chats(
                params.data.teamId,
                user.id,
                query.data,
            );
            ResponseWriter.success(res, page, "Team chats fetched successfully");
        } catch (error) {
            if (error instanceof InvalidChatHistoryCursorError) {
                ResponseWriter.invalid_data(res, "Invalid cursor");
                return;
            }
            console.error("TeamChatGetController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
