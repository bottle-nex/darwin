import { Request, Response } from "express";
import { Action, Permissions } from "@trymatcha/access-control";
import z from "zod";
import Access from "../../access-control/access";
import BoardIssueService, { InvalidBoardCursorError } from "../../services/service.board-issues";
import ResponseWriter from "../../services/service.response";
import { board_lane_query_schema } from "./board-query.schema";

export default class IssueGetController {
    static params_schema = z.object({ project_id: z.string().min(1) });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const params = IssueGetController.params_schema.safeParse(req.params);
        const query = board_lane_query_schema.safeParse(req.query);
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
            if (query.data.lane_type === "custom") {
                const column = await BoardIssueService.find_project_column(
                    params.data.project_id,
                    query.data.column_id,
                );
                if (!column) {
                    ResponseWriter.not_found(res, "Column not found");
                    return;
                }
            }

            const page = await BoardIssueService.list_lane(
                params.data.project_id,
                query.data,
                query.data.cursor,
                query.data.limit,
            );
            ResponseWriter.success(res, page, "Issues fetched successfully");
        } catch (error) {
            if (error instanceof InvalidBoardCursorError) {
                ResponseWriter.invalid_data(res, "Invalid cursor");
                return;
            }
            console.error("IssueGetController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
