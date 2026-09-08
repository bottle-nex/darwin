import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

/**
 * Saves how one user wants a pane laid out. Like column reordering, this only
 * changes what the requesting user sees, so any project member may write it.
 */
export default class ViewPreferenceSetController {
    static params_schema = z.object({
        project_id: z.string().min(1),
    });

    static body_schema = z.object({
        view_key: z.string().min(1).max(191),
        layout: z.enum(["list", "board"]),
        group_by: z.string().min(1).max(64),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const params = ViewPreferenceSetController.params_schema.safeParse(req.params);
        const body = ViewPreferenceSetController.body_schema.safeParse(req.body);
        if (!params.success || !body.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const role = await Access.project(user.id, params.data.project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to the project");
            return;
        }

        try {
            const view = await prisma.issueViewPreference.upsert({
                where: {
                    userId_projectId_viewKey: {
                        userId: user.id,
                        projectId: params.data.project_id,
                        viewKey: body.data.view_key,
                    },
                },
                create: {
                    userId: user.id,
                    projectId: params.data.project_id,
                    viewKey: body.data.view_key,
                    layout: body.data.layout,
                    groupBy: body.data.group_by,
                },
                update: { layout: body.data.layout, groupBy: body.data.group_by },
                select: { viewKey: true, layout: true, groupBy: true },
            });
            ResponseWriter.success(res, { view }, "View preference saved");
        } catch (error) {
            console.error("ViewPreferenceSetController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
