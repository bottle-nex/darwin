import { Action, Permissions } from "@trymatcha/access-control";
import { Effort, Harness, Prisma, prisma } from "@trymatcha/database";
import { Registry } from "@trymatcha/harness";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    project_id: z.string(),
});

const body_schema = z
    .object({
        kanban_option_view: z.enum(["FLAT", "GROUPED"]).optional(),
        harness: z.enum(Harness).optional(),
        default_model: z.string().min(1).optional(),
        default_effort: z.enum(Effort).optional(),
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
        const { kanban_option_view, harness, default_model, default_effort } = parsed_body.data;
        const user_id = req.user.id;

        const project_role = await Access.project(user_id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.update)) {
            ResponseWriter.not_authorized(res, "You don't have permission to update this project");
            return;
        }

        if (default_model || default_effort) {
            const existing = await prisma.projectConfig.findUnique({
                where: { projectId: project_id },
                select: { harness: true },
            });
            const effective_harness = harness ?? existing?.harness ?? Harness.Claude;

            if (default_model && !Registry.supportsModel(effective_harness, default_model)) {
                ResponseWriter.invalid_data(
                    res,
                    `"${default_model}" is not supported by the ${effective_harness} harness`,
                );
                return;
            }

            if (default_effort && !Registry.supportsEffort(effective_harness)) {
                ResponseWriter.invalid_data(
                    res,
                    `The ${effective_harness} harness does not support an effort level`,
                );
                return;
            }
        }

        const config_data = {
            ...(kanban_option_view !== undefined && { kanbanOptionView: kanban_option_view }),
            ...(harness !== undefined && { harness }),
            ...(default_model !== undefined && { defaultModel: default_model }),
            ...(default_effort !== undefined && { defaultEffort: default_effort }),
        };
        const config = await prisma.projectConfig.upsert({
            where: { projectId: project_id },
            create: { projectId: project_id, ...config_data },
            update: config_data,
            select: {
                kanbanOptionView: true,
                productDiffEnabled: true,
                harness: true,
                defaultModel: true,
                defaultEffort: true,
            },
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
