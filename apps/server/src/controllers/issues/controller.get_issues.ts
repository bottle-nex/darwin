import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";

export default class IssueGetController {
    static body_schema = z.object({
        project_id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = IssueGetController.body_schema.safeParse(req.params);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const project_id = data.project_id;

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to the project");
            return;
        }

        try {
            const [columns, issues, personal_orders] = await Promise.all([
                prisma.customColumn.findMany({
                    where: {
                        projectId: project_id,
                    },
                    orderBy: {
                        order: "asc",
                    },
                    select: {
                        id: true,
                        label: true,
                        order: true,
                    },
                }),
                prisma.issue.findMany({
                    where: {
                        projectId: project_id,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        description: true,
                        priority: true,
                        status: true,
                        customColumnId: true,
                        createdAt: true,
                        startDate: true,
                        targetDate: true,
                        prUrl: true,
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                        assignees: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                        tags: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            },
                        },
                    },
                }),
                prisma.customColumnOrder.findMany({
                    where: {
                        userId: user.id,
                        projectId: project_id,
                    },
                    select: {
                        columnId: true,
                        order: true,
                    },
                }),
            ]);

            // Merge in the requesting user's personal column order: columns they've
            // pinned come first (in their pinned order), everything else follows in
            // the project's default order — so a new/unpinned column always lands last.
            const personal_order_by_column = new Map(
                personal_orders.map((p) => [p.columnId, p.order]),
            );
            const ordered_columns = [...columns].sort((a, b) => {
                const a_pos = personal_order_by_column.get(a.id);
                const b_pos = personal_order_by_column.get(b.id);
                if (a_pos !== undefined && b_pos !== undefined) return a_pos - b_pos;
                if (a_pos !== undefined) return -1;
                if (b_pos !== undefined) return 1;
                return a.order - b.order;
            });

            ResponseWriter.success(
                res,
                { columns: ordered_columns, issues },
                "Issues fetched succesfully",
            );
        } catch (err) {
            console.error("IssuesGetController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
