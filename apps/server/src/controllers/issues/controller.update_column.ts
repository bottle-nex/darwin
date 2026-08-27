import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

export default class ColumnUpdateController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static body_schema = z.object({
        label: z.string().min(1).max(100).optional(),
        order: z.number().int().optional(),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success: params_ok } =
            ColumnUpdateController.params_schema.safeParse(req.params);
        if (!params_ok) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const { data: body_data, success: body_ok } = ColumnUpdateController.body_schema.safeParse(
            req.body,
        );
        if (!body_ok) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const column = await prisma.customColumn.findUnique({
                where: { id: params_data.id },
                select: { chapter: { select: { projectId: true } } },
            });
            if (!column) {
                ResponseWriter.not_found(res, "Column not found");
                return;
            }

            const role = await Access.project(user.id, column.chapter.projectId);
            if (!role || !Permissions.project(role, Action.project.manage_columns)) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            const updated = await prisma.customColumn.update({
                where: { id: params_data.id },
                data: {
                    label: body_data.label,
                    order: body_data.order,
                },
                select: { id: true, chapterId: true, label: true, order: true },
            });

            ResponseWriter.success(res, { column: updated }, "Column updated");
        } catch (error) {
            ResponseWriter.system_error(res);
        }
    }
}
