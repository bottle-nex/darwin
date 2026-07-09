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
            const [columns, issues] = await Promise.all([
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
                        assignees: {
                            select: {
                                id: true,
                                name: true,
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
            ]);

            ResponseWriter.success(res, { columns, issues }, "Issues fetched succesfully");
        } catch (err) {
            console.error("IssuesGetController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
