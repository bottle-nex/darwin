import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

export default async function delete_tag_controller(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const project_id = req.params.project_id as string;
        if (!project_id) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }

        const tag_id = req.params.tag_id as string;
        if (!tag_id) {
            ResponseWriter.not_found(res, "Tag not found");
            return;
        }

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.manage_tags)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to manage this project's tags",
            );
            return;
        }

        const existing = await prisma.tag.findUnique({
            where: { id: tag_id },
            select: { projectId: true },
        });
        if (!existing || existing.projectId !== project_id) {
            ResponseWriter.not_found(res, "Tag not found");
            return;
        }

        await prisma.tag.delete({ where: { id: tag_id } });

        ResponseWriter.success(res, { id: tag_id }, "Tag deleted");
    } catch (err) {
        console.error("delete_tag_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
