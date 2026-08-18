import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import IssueService from "../../services/service.issue";

export default class IssueCreateController {
    static body_schema = z
        .object({
            project_id: z.string().min(1),
            title: z.string().min(1).max(80),
            description: z.string().max(20000),
            priority: z.number().int().min(0).max(4).optional(),
            custom_column_id: z.string().optional(),
            start_date: z.coerce.date().optional(),
            target_date: z.coerce.date().optional(),
            assignee_ids: z.array(z.string()).max(20).optional(),
            tag_ids: z.array(z.string()).max(20).optional(),
        })
        .refine((data) => data.custom_column_id || data.description.trim().length > 0, {
            message: "Description is required",
            path: ["description"],
        })
        .refine((data) => data.custom_column_id || (data.assignee_ids?.length ?? 0) > 0, {
            message: "At least one assignee is required",
            path: ["assignee_ids"],
        });

    static async process(req: Request, res: Response) {
        console.log("[issue:create] received request to create issue");
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }
            const parsed_body = IssueCreateController.body_schema.safeParse(req.body);
            if (!parsed_body.success) {
                ResponseWriter.invalid_data(res, "Invalid issue data provided");
                return;
            }

            const role = await Access.project(user.id, parsed_body.data.project_id);
            if (!role || !Permissions.project(role, Action.project.create_issue)) {
                ResponseWriter.not_authorized(
                    res,
                    "You dont have permissions to create issues in this project",
                );
                return;
            }

            if (parsed_body.data.custom_column_id) {
                const column = await prisma.customColumn.findFirst({
                    where: {
                        id: parsed_body.data.custom_column_id,
                        projectId: parsed_body.data.project_id,
                    },
                    select: { id: true },
                });
                if (!column) {
                    ResponseWriter.invalid_data(res, "Column not found in this project");
                    return;
                }
            }

            if (parsed_body.data.assignee_ids?.length) {
                const assignee_roles = await Promise.all(
                    parsed_body.data.assignee_ids.map((id) =>
                        Access.project(id, parsed_body.data.project_id),
                    ),
                );
                if (assignee_roles.some((assignee_role) => !assignee_role)) {
                    ResponseWriter.invalid_data(
                        res,
                        "One or more assignees are not project members",
                    );
                    return;
                }
            }

            if (parsed_body.data.tag_ids?.length) {
                const tag_count = await prisma.tag.count({
                    where: {
                        id: { in: parsed_body.data.tag_ids },
                        projectId: parsed_body.data.project_id,
                    },
                });
                if (tag_count !== parsed_body.data.tag_ids.length) {
                    ResponseWriter.invalid_data(res, "One or more tags are not in this project");
                    return;
                }
            }

            const full_issue = await IssueService.create_issue({
                project_id: parsed_body.data.project_id,
                title: parsed_body.data.title,
                description: parsed_body.data.description,
                priority: parsed_body.data.priority,
                custom_column_id: parsed_body.data.custom_column_id,
                start_date: parsed_body.data.start_date,
                target_date: parsed_body.data.target_date,
                assignee_ids: parsed_body.data.assignee_ids,
                tag_ids: parsed_body.data.tag_ids,
                created_by: { id: user.id, name: user.name },
            });

            if (!full_issue) {
                ResponseWriter.system_error(res);
                return;
            }

            ResponseWriter.created(res, { issue: full_issue }, "Issue created successfully");
        } catch (err) {
            console.log("[issue:create] error while creating issue", err);
            ResponseWriter.system_error(res);
        }
    }
}
