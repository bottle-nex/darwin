import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import { BOARD_ISSUE_SELECT } from "../../services/service.board-issues";
import ResponseWriter from "../../services/service.response";

export default class IssueGetByIdController {
    static params_schema = z.object({ id: z.string().min(1) });
    static query_schema = z.object({ project_id: z.string().min(1) });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const params = IssueGetByIdController.params_schema.safeParse(req.params);
        const query = IssueGetByIdController.query_schema.safeParse(req.query);
        if (!params.success || !query.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const issue = await prisma.issue.findFirst({
                where: { id: params.data.id, projectId: query.data.project_id },
                select: BOARD_ISSUE_SELECT,
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, query.data.project_id);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            ResponseWriter.success(res, { issue }, "Issue fetched successfully");
        } catch (error) {
            console.error("IssueGetByIdController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
