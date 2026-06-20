import { IssueStatus, prisma } from "@trymatcha/database";
import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

export default class IssueUpdateController {
    static body_scheam = z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        priority: z.number().int().min(1).max(4).optional(),
        label: z.string().nullable().optional(),
        status: z.enum(IssueStatus).optional(),
        custom_column_id: z.string().nullable().optional(),
    });

    static params_schema = z.object({
        id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success: params_success } =
            IssueUpdateController.params_schema.safeParse(req.params);
        if (!params_success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const id = params_data.id;

        const { data: body_data, success: body_success } =
            IssueUpdateController.body_scheam.safeParse(req.body);
        if (!body_success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const issue = await prisma.issue.findUnique({
                where: {
                    id,
                },
                select: {
                    projectId: true,
                },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }
            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.triage_issue)) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            if (body_data.custom_column_id) {
                const column = await prisma.customColumn.findFirst({
                    where: { id: body_data.custom_column_id, projectId: issue.projectId },
                    select: { id: true },
                });
                if (!column) {
                    ResponseWriter.invalid_data(res, "Column not found in this project");
                    return;
                }
            }

            const updated = await prisma.issue.update({
                where: { id },
                data: {
                    title: body_data.title,
                    description: body_data.description,
                    priority: body_data.priority,
                    label: body_data.label,
                    status: body_data.status,
                    customColumnId: body_data.custom_column_id,
                },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    description: true,
                    priority: true,
                    label: true,
                    status: true,
                    customColumnId: true,
                    createdAt: true,
                    assignees: { select: { id: true, name: true, image: true } },
                },
            });

            ResponseWriter.success(res, { issue: updated }, "Issue updated");
        } catch (error) {
            ResponseWriter.system_error(res);
        }
    }
}
