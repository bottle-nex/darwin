import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import { prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

export default async function delete_template_controller(req: Request, res: Response) {
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

        const template_id = req.params.template_id as string;
        if (!template_id) {
            ResponseWriter.not_found(res, "Issue template not found");
            return;
        }

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.manage_templates)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to manage this project's issue templates",
            );
            return;
        }

        const existing = await prisma.issueTemplate.findUnique({
            where: { id: template_id },
            select: { projectId: true },
        });
        if (!existing || existing.projectId !== project_id) {
            ResponseWriter.not_found(res, "Issue template not found");
            return;
        }

        await prisma.issueTemplate.delete({ where: { id: template_id } });

        ResponseWriter.success(res, { id: template_id }, "Issue template deleted");
    } catch (err) {
        console.error("delete_template_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
