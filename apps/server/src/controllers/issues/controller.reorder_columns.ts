import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

/**
 * Persists one user's personal display order for a project's custom columns.
 * Unlike column create/rename/delete (gated on `manage_columns`), reordering
 * only changes what the requesting user sees, so any project member may do it.
 */
export default class ColumnReorderController {
    static body_schema = z.object({
        project_id: z.string().min(1),
        column_ids: z.array(z.string().min(1)).min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = ColumnReorderController.body_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const role = await Access.project(user.id, data.project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to the project");
            return;
        }

        try {
            await prisma.$transaction(async (tx) => {
                const existing_columns = await tx.customColumn.findMany({
                    where: { projectId: data.project_id },
                    select: { id: true },
                });
                const existing_ids = new Set(existing_columns.map((c) => c.id));

                const is_same_set =
                    data.column_ids.length === existing_ids.size &&
                    data.column_ids.every((id) => existing_ids.has(id));
                if (!is_same_set) {
                    throw new StaleColumnListError();
                }

                await Promise.all(
                    data.column_ids.map((columnId, order) =>
                        tx.customColumnOrder.upsert({
                            where: { userId_columnId: { userId: user.id, columnId } },
                            create: {
                                userId: user.id,
                                projectId: data.project_id,
                                columnId,
                                order,
                            },
                            update: { order },
                        }),
                    ),
                );
            });

            ResponseWriter.success(res, { ok: true }, "Column order updated");
        } catch (error) {
            if (error instanceof StaleColumnListError) {
                ResponseWriter.invalid_data(res, "Column list is out of date, refresh and retry");
                return;
            }
            ResponseWriter.system_error(res);
        }
    }
}

class StaleColumnListError extends Error {}
