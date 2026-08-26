import { Request, Response } from "express";
import z from "zod";
import { Effort, Harness, IssueStatus, prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import { is_effort_supported, is_model_supported } from "@trymatcha/harness";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";

// An issue whose sandbox already started can't have its harness swapped under it —
// a running solve can't hot-swap its CLI, credentials, or flag syntax mid-run.
const FROZEN_STATUSES: IssueStatus[] = [
    IssueStatus.InProgress,
    IssueStatus.InReview,
    IssueStatus.Done,
    IssueStatus.Failed,
    IssueStatus.Cancelled,
];

export default class IssueSetConfigController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static body_schema = z.object({
        harness: z.enum(Harness),
        model: z.string().min(1),
        effort: z.enum(Effort).optional(),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success: params_ok } =
            IssueSetConfigController.params_schema.safeParse(req.params);
        const { data: body_data, success: body_ok } =
            IssueSetConfigController.body_schema.safeParse(req.body);
        if (!params_ok || !body_ok) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const { harness, model, effort } = body_data;

        if (!is_model_supported(harness, model)) {
            ResponseWriter.invalid_data(
                res,
                `"${model}" is not supported by the ${harness} harness`,
            );
            return;
        }

        if (effort && !is_effort_supported(harness)) {
            ResponseWriter.invalid_data(
                res,
                `The ${harness} harness does not support an effort level`,
            );
            return;
        }

        try {
            const issue = await prisma.issue.findUnique({
                where: { id: params_data.id },
                select: { projectId: true, status: true },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.update)) {
                ResponseWriter.not_authorized(res, "You dont have permission to update this issue");
                return;
            }

            if (FROZEN_STATUSES.includes(issue.status)) {
                ResponseWriter.custom(
                    res,
                    false,
                    "ISSUE_CONFIG_FROZEN",
                    "This issue's harness can no longer be changed — its sandbox has already started",
                    409,
                );
                return;
            }

            const config = await prisma.issueConfig.upsert({
                where: { issueId: params_data.id },
                create: { issueId: params_data.id, harness, model, effort },
                update: { harness, model, effort },
                select: { harness: true, model: true, effort: true },
            });

            ResponseWriter.success(res, { config }, "Issue config updated");
        } catch (error) {
            console.error("error in IssueSetConfigController:", error);
            ResponseWriter.system_error(res);
        }
    }
}
