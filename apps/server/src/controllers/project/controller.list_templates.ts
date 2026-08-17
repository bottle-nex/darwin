import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import { prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

export default async function list_templates_controller(req: Request, res: Response) {
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
                "You don't have permission to view this project's issue templates",
            );
            return;
        }

        const templates = await prisma.issueTemplate.findMany({
            where: { projectId: project_id },
            select: {
                id: true,
                name: true,
                description: true,
                icon: true,
                isDefault: true,
                createdAt: true,
            },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });

        ResponseWriter.success(res, { templates });
    } catch (err) {
        console.error("list_templates_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
