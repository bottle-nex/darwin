import { Action, Permissions } from "@trymatcha/access-control";
import { Prisma, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    project_id: z.string(),
});

const SAFE_APPLICATION_PATH = /^[A-Za-z0-9@._/-]+$/;
const SAFE_OVERRIDE = /^[A-Za-z0-9_@%+=:,./ -]+$/;
const SAFE_HEALTH_PATH = /^\/[A-Za-z0-9._~/-]*$/;
const PACKAGE_MANAGERS = new Set(["bun", "pnpm", "yarn", "npm"]);

function valid_application_path(application_path: string): boolean {
    if (application_path === ".") return true;
    return (
        SAFE_APPLICATION_PATH.test(application_path) &&
        !application_path.startsWith("/") &&
        !application_path.endsWith("/") &&
        application_path
            .split("/")
            .every((segment) => segment !== "" && segment !== "." && segment !== "..")
    );
}

function valid_launch_command(command: string): boolean {
    if (!SAFE_OVERRIDE.test(command)) return false;
    const executable = command.split(/\s+/, 1)[0];
    return (
        PACKAGE_MANAGERS.has(executable) &&
        !/(?:^|\s)(?:--(?:hostname|host|port)(?:=|\s|$)|-p(?:\d+)?(?:\s|$))/.test(command)
    );
}

const product_diff_preview_config_schema = z
    .object({
        applicationPath: z.string().min(1).max(240).refine(valid_application_path).optional(),
        launchCommand: z.string().trim().min(1).max(500).refine(valid_launch_command).optional(),
        healthPath: z.string().max(240).regex(SAFE_HEALTH_PATH).optional(),
        visualRoutes: z
            .array(z.string().max(240).regex(SAFE_HEALTH_PATH))
            .min(1)
            .max(50)
            .refine((routes) => new Set(routes).size === routes.length)
            .optional(),
    })
    .strict();

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

        const config_data = {
            ...(kanban_option_view !== undefined && { kanbanOptionView: kanban_option_view }),
            ...(product_diff_preview_config !== undefined && {
                productDiffPreviewConfig: product_diff_preview_config,
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
