import { Harness, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

export default class IssueGetConfigController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success: params_ok } =
            IssueGetConfigController.params_schema.safeParse(req.params);
        if (!params_ok) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const issue = await prisma.issue.findUnique({
                where: { id: params_data.id },
                select: {
                    projectId: true,
                    issueConfig: { select: { harness: true, model: true, effort: true } },
                    project: {
                        select: {
                            projectConfig: {
                                select: { harness: true, defaultModel: true, defaultEffort: true },
                            },
                        },
                    },
                },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            const config = issue.issueConfig ?? {
                harness: issue.project.projectConfig?.harness ?? Harness.Claude,
                model: issue.project.projectConfig?.defaultModel ?? null,
                effort: issue.project.projectConfig?.defaultEffort ?? null,
            };

            ResponseWriter.success(res, { config, is_override: Boolean(issue.issueConfig) });
        } catch (error) {
            console.error("error in IssueGetConfigController:", error);
            ResponseWriter.system_error(res);
        }
    }
}
