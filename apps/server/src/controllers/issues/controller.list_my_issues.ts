import { Action, Permissions } from "@trydarwin/access-control";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import BoardIssueService, { InvalidBoardCursorError } from "../../services/service.board-issues";
import ResponseWriter from "../../services/service.response";
import { my_issues_query_schema } from "./board-query.schema";

export default class MyIssuesListController {
    static params_schema = z.object({ project_id: z.string().min(1) });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const params = MyIssuesListController.params_schema.safeParse(req.params);
        const query = my_issues_query_schema.safeParse(req.query);
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
            const page = await BoardIssueService.list_my_issues(
                params.data.project_id,
                user.id,
                query.data,
            );
            ResponseWriter.success(res, page, "My issues fetched successfully");
        } catch (error) {
            if (error instanceof InvalidBoardCursorError) {
                ResponseWriter.invalid_data(res, "Invalid cursor");
                return;
            }
            console.error("MyIssuesListController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
