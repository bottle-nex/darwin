import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import z from "zod";

import { server_services } from "../..";
import Access from "../../access-control/access";
import ProductDiffService from "../../services/service.product_diff";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    project_id: z.string(),
    issue_id: z.string(),
});

export default async function regenerate_product_diff_controller(req: Request, res: Response) {
    try {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid Product Diff");
            return;
        }

        const { project_id, issue_id } = parsed.data;
        const project_role = await Access.project(req.user.id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.update)) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const issue = await prisma.issue.findFirst({
            where: { id: issue_id, projectId: project_id },
            select: { id: true },
        });
        if (!issue) {
            ResponseWriter.not_found(res, "Issue not found");
            return;
        }

        const product_diff = await ProductDiffService.prepare(issue.id, true);
        if (!product_diff) {
            ResponseWriter.custom(
                res,
                false,
                "PRODUCT_DIFF_NOT_ELIGIBLE",
                "No Product Diff can be generated for the current PR",
                409,
            );
            return;
        }

        await server_services.queue.enqueue_product_diff(product_diff.id);
        ResponseWriter.success(res, { id: product_diff.id }, "Product Diff queued");
    } catch (error) {
        console.error("error in regenerate_product_diff_controller:", error);
        ResponseWriter.system_error(res);
    }
}
