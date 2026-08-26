import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    org_id: z.string(),
});

export default async function list_projects_controller(req: Request, res: Response) {
    try {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid org id");
            return;
        }

        const { org_id } = parsed.data;
        const user_id = req.user.id;

        const org_role = await Access.org(user_id, org_id);
        if (!org_role || !Permissions.org(org_role, Action.org.read)) {
            ResponseWriter.not_authorized(res, "You don't have access to this org");
            return;
        }

        const projects = await prisma.project.findMany({
            where: { orgId: org_id },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                ownerId: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        ResponseWriter.success(res, projects);
    } catch (error) {
        console.error("error in list_projects_controller:", error);
        ResponseWriter.system_error(res);
    }
}
