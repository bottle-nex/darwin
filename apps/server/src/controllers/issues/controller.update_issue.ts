import { IssueStatus, prisma } from "@trymatcha/database";
import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

export default class IssueUpdateController {
    static body_scheam = z.object({
        title: z.string().min(1).max(200).optional(),
        summary: z.string().max(255).nullable().optional(),
        description: z.string().optional(),
        priority: z.number().int().min(1).max(4).optional(),
        status: z.enum(IssueStatus).optional(),
        custom_column_id: z.string().nullable().optional(),
        // Omit to leave untouched; an empty array clears them.
        tag_ids: z.array(z.string()).max(20).optional(),
        assignee_ids: z.array(z.string()).max(20).optional(),
        // `null` before `coerce.date()` — otherwise `new Date(null)` silently
        // coerces a clear into the 1970 epoch. Omit to leave untouched.
        start_date: z.union([z.null(), z.coerce.date()]).optional(),
        target_date: z.union([z.null(), z.coerce.date()]).optional(),
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
                    status: true,
                    customColumnId: true,
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

            if (body_data.tag_ids?.length) {
                const tag_count = await prisma.tag.count({
                    where: { id: { in: body_data.tag_ids }, projectId: issue.projectId },
                });
                if (tag_count !== body_data.tag_ids.length) {
                    ResponseWriter.invalid_data(res, "One or more tags are not in this project");
                    return;
                }
            }

            // Every assignee must themselves be a member of this project.
            if (body_data.assignee_ids?.length) {
                const assignee_roles = await Promise.all(
                    body_data.assignee_ids.map((id) => Access.project(id, issue.projectId)),
                );
                if (assignee_roles.some((assignee_role) => !assignee_role)) {
                    ResponseWriter.invalid_data(
                        res,
                        "One or more assignees are not project members",
                    );
                    return;
                }
            }

            const next_column_id =
                body_data.custom_column_id !== undefined
                    ? body_data.custom_column_id
                    : issue.customColumnId;

            let next_status: IssueStatus;
            if (next_column_id !== null) {
                next_status = IssueStatus.Parked;
            } else if (body_data.status && body_data.status !== IssueStatus.Parked) {
                next_status = body_data.status;
            } else if (issue.status === IssueStatus.Parked) {
                next_status = IssueStatus.Todo;
            } else {
                next_status = issue.status;
            }

            const updated = await prisma.issue.update({
                where: { id },
                data: {
                    title: body_data.title,
                    summary: body_data.summary,
                    description: body_data.description,
                    priority: body_data.priority,
                    status: next_status,
                    customColumnId: next_column_id,
                    startDate: body_data.start_date,
                    targetDate: body_data.target_date,
                    // `set` replaces; `connect` would only ever append, so a
                    // removed tag or assignee could never actually be removed.
                    tags: body_data.tag_ids
                        ? { set: body_data.tag_ids.map((id) => ({ id })) }
                        : undefined,
                    assignees: body_data.assignee_ids
                        ? { set: body_data.assignee_ids.map((id) => ({ id })) }
                        : undefined,
                },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    summary: true,
                    description: true,
                    priority: true,
                    status: true,
                    customColumnId: true,
                    createdAt: true,
                    startDate: true,
                    targetDate: true,
                    assignees: { select: { id: true, name: true, email: true, image: true } },
                    tags: { select: { id: true, name: true, color: true } },
                },
            });

            ResponseWriter.success(res, { issue: updated }, "Issue updated");
        } catch (error) {
            ResponseWriter.system_error(res);
        }
    }
}
