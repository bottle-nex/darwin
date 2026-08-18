import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";
import { Prisma, prisma } from "@trymatcha/database";

const params_schema = z.object({
    project_id: z.string(),
});

const body_schema = z.object({
    kanban_option_view: z.enum(["FLAT", "GROUPED"]).optional(),
});

export default async function update_project_config_controller(req: Request, res: Response) {
    try {
        const parsed_params = params_schema.safeParse(req.params);
        if (!parsed_params.success) {
            ResponseWriter.invalid_data(res, "Invalid project id");
            return;
        }

        const parsed_body = body_schema.safeParse(req.body);
        if (!parsed_body.success) {
            ResponseWriter.invalid_data(res, "Invalid data provided");
            return;
        }

        const { project_id } = parsed_params.data;
        const { kanban_option_view } = parsed_body.data;
        const user_id = req.user.id;

        const project_role = await Access.project(user_id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.update)) {
            ResponseWriter.not_authorized(res, "You don't have permission to update this project");
            return;
        }

        const config = await prisma.projectConfig.upsert({
            where: { projectId: project_id },
            create: { projectId: project_id, kanbanOptionView: kanban_option_view },
            update: { kanbanOptionView: kanban_option_view },
            select: { kanbanOptionView: true, productDiffEnabled: true },
        });

        ResponseWriter.success(res, config, "Project config updated successfully");
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }
        console.error("error in update_project_config_controller:", error);
        ResponseWriter.system_error(res);
    }
}
