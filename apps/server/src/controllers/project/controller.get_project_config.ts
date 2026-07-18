import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";
import { prisma } from "@trymatcha/database";

const params_schema = z.object({
    project_id: z.string(),
});

export default async function get_project_config_controller(req: Request, res: Response) {
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
            ResponseWriter.not_authorized(res, "You dont have access to this project");
            return;
        }

        const config = await prisma.projectConfig.findUniqueOrThrow({
            where: { projectId: project_id },
            select: { kanbanOptionView: true },
        });

        ResponseWriter.success(res, config);
    } catch (error) {
        console.error("error in get_project_config_controller:", error);
        ResponseWriter.system_error(res);
    }
}
