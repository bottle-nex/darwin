import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import { z } from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    userId: z.string().nonempty(),
    role: z.enum(["Admin", "Maintain", "Write", "Triage", "Read"]),
});

export default async function change_project_role_controller(req: Request, res: Response) {
    const project_id = req.params.project_id as string;
    const parsed = body_schema.safeParse(req.body);

    if (!project_id || !parsed.success) {
        ResponseWriter.invalid_data(res, "invalid_data");
        return;
    }

    try {
        const { userId, role } = parsed.data;

        if (userId === req.user.id) {
            ResponseWriter.custom(
                res,
                false,
                "CHANGING_YOURSELF",
                "you can't change your own project role",
                409,
            );
            return;
        }

        const viewer_role = await Access.project(req.user.id, project_id);
        if (!viewer_role || !Permissions.project(viewer_role, Action.project.change_member_role)) {
            ResponseWriter.not_authorized(res, "insufficient permissions", 403);
            return;
        }

        const target = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: project_id, userId } },
            select: { role: true },
        });
        if (!target) {
            ResponseWriter.not_found(res, "member not found in project");
            return;
        }

        await prisma.projectMember.update({
            where: { projectId_userId: { projectId: project_id, userId } },
            data: { role },
        });

        ResponseWriter.success(res, { userId, role }, "project role updated");
    } catch (error) {
        console.error("change_project_role_controller failed: ", error);
        ResponseWriter.system_error(res);
    }
}
