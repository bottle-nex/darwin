import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

/**
 * Persists one user's personal display order for a space's custom columns.
 * Unlike column create/rename/delete (gated on `manage_columns`), reordering
 * only changes what the requesting user sees, so any project member may do it.
 */
export default class ColumnReorderController {
    static body_schema = z.object({
        space_id: z.string().min(1),
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

        const space = await prisma.space.findUnique({
            where: { id: data.space_id },
            select: { projectId: true },
        });
        if (!space) {
            ResponseWriter.not_found(res, "Space not found");
            return;
        }

        const role = await Access.project(user.id, space.projectId);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to the project");
            return;
        }

        try {
            await prisma.$transaction(async (tx) => {
                const existing_columns = await tx.customColumn.findMany({
                    where: { spaceId: data.space_id },
                    select: { id: true },
                });
                const existing_ids = new Set(existing_columns.map((c) => c.id));

                const is_same_set =
                    data.column_ids.length === existing_ids.size &&
                    data.column_ids.every((id) => existing_ids.has(id));
                if (!is_same_set) {
                    throw new StaleColumnListError();
                }

                // Sequential, not Promise.all: a transaction pins one pg connection, so firing
                // every upsert at once overlaps queries on it — which pg 9 rejects outright.
                for (const [order, columnId] of data.column_ids.entries()) {
                    await tx.customColumnOrder.upsert({
                        where: { userId_columnId: { userId: user.id, columnId } },
                        create: {
                            userId: user.id,
                            spaceId: data.space_id,
                            columnId,
                            order,
                        },
                        update: { order },
                    });
                }
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
