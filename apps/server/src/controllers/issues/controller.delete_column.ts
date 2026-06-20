import { Request, Response } from "express";
import z from "zod";
import { prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";

export default class ColumnDeleteController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success } = ColumnDeleteController.params_schema.safeParse(
            req.params,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const column = await prisma.customColumn.findUnique({
                where: { id: params_data.id },
                select: { projectId: true },
            });
            if (!column) {
                ResponseWriter.not_found(res, "Column not found");
                return;
            }

            const role = await Access.project(user.id, column.projectId);
            if (!role || !Permissions.project(role, Action.project.manage_columns)) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            // Count the parked issues first so the client can confirm the destructive
            // delete ("this will delete N issues"). They are removed by the DB cascade
            // on `customColumn.delete` (Issue.customColumn is onDelete: Cascade).
            const deleted_issues = await prisma.issue.count({
                where: { customColumnId: params_data.id },
            });

            await prisma.customColumn.delete({ where: { id: params_data.id } });

            ResponseWriter.success(res, { ok: true, deleted_issues }, "Column deleted");
        } catch (error) {
            ResponseWriter.system_error(res);
        }
    }
}
