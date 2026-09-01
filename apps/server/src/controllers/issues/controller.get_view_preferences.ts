import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

/** Every saved layout/grouping this user has in one project, keyed by its pane. */
export default class ViewPreferencesGetController {
    static params_schema = z.object({
        project_id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = ViewPreferencesGetController.params_schema.safeParse(req.params);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const role = await Access.project(user.id, data.project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to the project");
            return;
        }

        try {
            const views = await prisma.issueViewPreference.findMany({
                where: { userId: user.id, projectId: data.project_id },
                select: { viewKey: true, layout: true, groupBy: true },
            });
            ResponseWriter.success(res, { views }, "View preferences");
        } catch (error) {
            console.error("ViewPreferencesGetController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
