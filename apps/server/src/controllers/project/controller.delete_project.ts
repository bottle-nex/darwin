import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";
import { prisma } from "@trymatcha/database";

const body_schema = z.object({
    project_id: z.uuid(),
});

export default async function delete_project_controller(req: Request, res: Response) {
    try {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid project id provided");
            return;
        }

        const { project_id } = parsed.data;
        const user_id = req.user.id;

        const [project, project_role] = await Promise.all([
            prisma.project.findUnique({ where: { id: project_id } }),
            Access.project(user_id, project_id),
        ]);

        if (!project) {
            ResponseWriter.not_found(res, "Project doesn't exist");
            return;
        }

        if (!project_role || !Permissions.project(project_role, Action.project.delete)) {
            ResponseWriter.not_authorized(res, "you don't have access to this project");
            return;
        }

        await prisma.project.delete({ where: { id: project_id } });

        ResponseWriter.success(res, { id: project_id }, "Project deleted successfully");
    } catch (error) {
        console.error("error in delete project controller: ", error);
        ResponseWriter.system_error(res);
    }
}
