import { Action, Permissions } from "@trymatcha/access-control";
import { Prisma, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import {
    merge_product_diff_preview_config,
    product_diff_preview_config_schema,
    read_product_diff_preview_config,
} from "./product-diff-preview-config.schema";

const params_schema = z.object({
    project_id: z.string(),
});

const body_schema = z
    .object({
        kanban_option_view: z.enum(["FLAT", "GROUPED"]).optional(),
        product_diff_preview_config: product_diff_preview_config_schema.optional(),
    })
    .strict();

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
        const { kanban_option_view, product_diff_preview_config } = parsed_body.data;
        const user_id = req.user.id;

        const project_role = await Access.project(user_id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.update)) {
            ResponseWriter.not_authorized(res, "You don't have permission to update this project");
            return;
        }

        const existing_config =
            product_diff_preview_config === undefined
                ? null
                : await prisma.projectConfig.findUnique({
                      where: { projectId: project_id },
                      select: { productDiffPreviewConfig: true },
                  });
        const preview_config =
            product_diff_preview_config === undefined
                ? undefined
                : merge_product_diff_preview_config(
                      existing_config?.productDiffPreviewConfig,
                      product_diff_preview_config,
                  );
        const config_data = {
            ...(kanban_option_view !== undefined && { kanbanOptionView: kanban_option_view }),
            ...(preview_config !== undefined && {
                productDiffPreviewConfig: preview_config as Prisma.InputJsonValue,
            }),
        };
        const config = await prisma.projectConfig.upsert({
            where: { projectId: project_id },
            create: { projectId: project_id, ...config_data },
            update: config_data,
            select: {
                kanbanOptionView: true,
                productDiffEnabled: true,
                productDiffPreviewConfig: true,
            },
        });

        ResponseWriter.success(
            res,
            {
                ...config,
                productDiffPreviewConfig: read_product_diff_preview_config(
                    config.productDiffPreviewConfig,
                ),
            },
            "Project config updated successfully",
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }
        console.error("error in update_project_config_controller:", error);
        ResponseWriter.system_error(res);
    }
}
