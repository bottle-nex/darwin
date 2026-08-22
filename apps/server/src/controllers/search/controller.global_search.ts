import { Request, Response } from "express";
import { Action, Permissions } from "@trymatcha/access-control";
import { MAX_GLOBAL_SEARCH_QUERY_LENGTH, MIN_GLOBAL_SEARCH_QUERY_LENGTH } from "@trymatcha/types";
import z from "zod";
import Access from "../../access-control/access";
import GlobalSearchService from "../../services/service.global-search";
import ResponseWriter from "../../services/service.response";

const EMPTY_RESULT = { issues: [], messages: [] };

export default class GlobalSearchController {
    static params_schema = z.object({ project_id: z.string().min(1) });

    static query_schema = z.object({
        q: z
            .string()
            .max(MAX_GLOBAL_SEARCH_QUERY_LENGTH)
            .transform((value) => value.trim()),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const params = GlobalSearchController.params_schema.safeParse(req.params);
        const query = GlobalSearchController.query_schema.safeParse(req.query);
        if (!params.success || !query.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const role = await Access.project(user.id, params.data.project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to the project");
            return;
        }

        if (query.data.q.length < MIN_GLOBAL_SEARCH_QUERY_LENGTH) {
            ResponseWriter.success(res, EMPTY_RESULT, "Search results fetched successfully");
            return;
        }

        try {
            const result = await GlobalSearchService.search(
                params.data.project_id,
                user.id,
                query.data.q,
            );
            ResponseWriter.success(res, result, "Search results fetched successfully");
        } catch (error) {
            console.error("GlobalSearchController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
