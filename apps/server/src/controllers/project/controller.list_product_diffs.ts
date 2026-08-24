import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ProductDiffService from "../../services/service.product_diff";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    project_id: z.string(),
});

export default async function list_product_diffs_controller(req: Request, res: Response) {
    try {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid project id");
            return;
        }

        const { project_id } = parsed.data;
        const project_role = await Access.project(req.user.id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.read)) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const product_diffs = await prisma.productDiff.findMany({
            where: { issue: { projectId: project_id } },
            include: { issue: { select: { number: true, title: true, prUrl: true } } },
            orderBy: { createdAt: "desc" },
        });

        ResponseWriter.success(res, product_diffs.map(ProductDiffService.to_summary));
    } catch (error) {
        console.error("error in list_product_diffs_controller:", error);
        ResponseWriter.system_error(res);
    }
}
