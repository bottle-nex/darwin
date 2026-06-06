import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";
import { prisma } from "@trymatcha/database";

const params_schema = z.object({
    project_id: z.string(),
});

export default async function get_project_controller(req: Request, res: Response) {
    try {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid project id");
            return;
        }

        const { project_id } = parsed.data;
        const user_id = req.user.id;

        const project_role = await Access.project(user_id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You don't have access to this project");
            return;
        }

        const project = await prisma.project.findUnique({
            where: { id: project_id },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                color: true,
                ownerId: true,
                createdAt: true,
                updatedAt: true,
                teams: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        projectRole: true,
                    },
                },
            },
        });

        if (!project) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }

        ResponseWriter.success(res, project);
    } catch (error) {
        console.error("error in get_project_controller:", error);
        ResponseWriter.system_error(res);
    }
}
