import { Action, Permissions } from "@trymatcha/access-control";
import { GithubImportTarget, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import { server_services } from "../..";
import Access from "../../access-control/access";
import BoardIssueService from "../../services/service.board-issues";
import GithubImportService from "../../services/service.github_import";
import ResponseWriter from "../../services/service.response";

const body_schema = z
    .object({
        enabled: z.boolean().optional(),
        target: z.enum(GithubImportTarget).optional(),
        custom_column_id: z.string().nullable().optional(),
        tag_id: z.string().nullable().optional(),
        backfill: z.boolean().optional(),
    })
    .refine(
        (data) => data.target !== GithubImportTarget.CustomColumn || Boolean(data.custom_column_id),
        { message: "Pick a column for the custom board", path: ["custom_column_id"] },
    );

type ResolvedConfig = {
    enabled: boolean;
    target: GithubImportTarget | null;
    customColumnId: string | null;
    tagId: string | null;
};

function what_setup_is_missing(config: ResolvedConfig): string | null {
    if (!config.target) return "Choose where imported issues should land.";
    if (config.target === GithubImportTarget.CustomColumn && !config.customColumnId) {
        return "Choose which column imported issues should land in.";
    }
    if (!config.tagId) return "Choose a tag for imported issues.";
    return null;
}

export default async function update_issue_import_controller(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = body_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res, "Invalid data provided");
            return;
        }

        const project_id = req.params.project_id as string;
        if (!project_id) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.manage_connectors)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to manage this project's connectors",
            );
            return;
        }

        const project = await prisma.project.findUnique({
            where: { id: project_id },
            select: { githubRepoId: true },
        });
        if (!project) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }
        if (!project.githubRepoId) {
            ResponseWriter.custom(
                res,
                false,
                "NO_REPOSITORY",
                "Connect a repository to this project before importing its issues.",
                409,
            );
            return;
        }

        if (data.custom_column_id) {
            const column = await BoardIssueService.find_project_column(
                project_id,
                data.custom_column_id,
            );
            if (!column) {
                ResponseWriter.invalid_data(res, "Column not found in this project");
                return;
            }
        }

        if (data.tag_id) {
            const tag = await prisma.tag.findFirst({
                where: { id: data.tag_id, projectId: project_id },
                select: { id: true },
            });
            if (!tag) {
                ResponseWriter.invalid_data(res, "Tag not found in this project");
                return;
            }
        }

        const config = await prisma.githubIssueImport.upsert({
            where: { projectId: project_id },
            create: {
                projectId: project_id,
                enabled: data.enabled ?? false,
                target: data.target ?? null,
                customColumnId: data.custom_column_id ?? null,
                tagId: data.tag_id ?? null,
                configuredById: user.id,
            },
            update: {
                enabled: data.enabled,
                target: data.target,
                customColumnId: data.custom_column_id,
                tagId: data.tag_id,
                configuredById: user.id,
            },
            select: {
                enabled: true,
                target: true,
                customColumnId: true,
                tagId: true,
                backfillAt: true,
            },
        });

        if (!config.tagId) {
            const tag_id = await GithubImportService.ensure_imported_tag(project_id, user.id);
            const attached = await prisma.githubIssueImport.update({
                where: { projectId: project_id },
                data: { tagId: tag_id },
                select: {
                    enabled: true,
                    target: true,
                    customColumnId: true,
                    tagId: true,
                    backfillAt: true,
                },
            });
            config.tagId = attached.tagId;
        }

        const missing = what_setup_is_missing(config);
        if (config.enabled && missing) {
            await prisma.githubIssueImport.update({
                where: { projectId: project_id },
                data: { enabled: false },
            });
            ResponseWriter.custom(res, false, "IMPORT_INCOMPLETE", missing, 409);
            return;
        }

        if (data.backfill && config.enabled) {
            await prisma.githubIssueImport.update({
                where: { projectId: project_id },
                data: { backfillAt: new Date() },
            });
            await server_services.queue.enqueue_github_backfill(project_id, 1);
        }

        ResponseWriter.success(res, config, "Issue import updated");
    } catch (err) {
        console.error("update_issue_import_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
