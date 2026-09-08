import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

export default async function list_tags_controller(req: Request, res: Response) {
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

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to view this project's tags",
            );
            return;
        }

        const tags = await prisma.tag.findMany({
            where: { projectId: project_id },
            select: {
                id: true,
                name: true,
                color: true,
                createdAt: true,
                creator: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        ResponseWriter.success(res, { tags });
    } catch (err) {
        console.error("list_tags_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
