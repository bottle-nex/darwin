import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

export default async function get_issue_import_controller(req: Request, res: Response) {
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

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.manage_connectors)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to manage this project's connectors",
            );
            return;
        }

        const [config, imported_count, latest] = await Promise.all([
            prisma.githubIssueImport.findUnique({
                where: { projectId: project_id },
                select: {
                    enabled: true,
                    target: true,
                    customColumnId: true,
                    tagId: true,
                    backfillAt: true,
                },
            }),
            prisma.githubIssueLink.count({ where: { projectId: project_id } }),
            prisma.githubIssueLink.findFirst({
                where: { projectId: project_id },
                orderBy: { createdAt: "desc" },
                select: { createdAt: true },
            }),
        ]);

        ResponseWriter.success(
            res,
            {
                enabled: config?.enabled ?? false,
                target: config?.target ?? null,
                customColumnId: config?.customColumnId ?? null,
                tagId: config?.tagId ?? null,
                backfillAt: config?.backfillAt ?? null,
                importedCount: imported_count,
                lastImportedAt: latest?.createdAt ?? null,
            },
            "Issue import config fetched",
        );
    } catch (err) {
        console.error("get_issue_import_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
