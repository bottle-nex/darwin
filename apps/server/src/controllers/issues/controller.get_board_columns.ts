import { Action, Permissions } from "@trydarwin/access-control";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import BoardIssueService from "../../services/service.board-issues";
import ResponseWriter from "../../services/service.response";

export default class BoardColumnsGetController {
    static params_schema = z.object({ project_id: z.string().min(1) });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const params = BoardColumnsGetController.params_schema.safeParse(req.params);
        if (!params.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const role = await Access.project(user.id, params.data.project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to the project");
            return;
        }

        try {
            const metadata = await BoardIssueService.get_board_metadata(
                params.data.project_id,
                user.id,
            );
            ResponseWriter.success(res, metadata, "Board columns fetched successfully");
        } catch (error) {
            console.error("BoardColumnsGetController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
