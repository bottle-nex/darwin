import { Request, Response } from "express";
import { Action, Permissions } from "@trymatcha/access-control";
import z from "zod";
import Access from "../../access-control/access";
import BoardIssueService, { InvalidBoardCursorError } from "../../services/service.board-issues";
import ResponseWriter from "../../services/service.response";
import { board_search_query_schema } from "./board-query.schema";

export default class BoardIssuesSearchController {
    static params_schema = z.object({ project_id: z.string().min(1) });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const params = BoardIssuesSearchController.params_schema.safeParse(req.params);
        const query = board_search_query_schema.safeParse(req.query);
        if (!params.success || !query.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const role = await Access.project(user.id, params.data.project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to the project");
            return;
        }

        try {
            const page = await BoardIssueService.search_board(
                params.data.project_id,
                query.data.filters,
                query.data.cursor,
                query.data.limit,
            );
            ResponseWriter.success(res, page, "Board issues searched successfully");
        } catch (error) {
            if (error instanceof InvalidBoardCursorError) {
                ResponseWriter.invalid_data(res, "Invalid cursor");
                return;
            }
            console.error("BoardIssuesSearchController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
