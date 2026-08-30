import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

export default class ColumnCreateController {
    static body_schema = z.object({
        space_id: z.string().min(1),
        label: z.string().min(1).max(100),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const parsed_body = ColumnCreateController.body_schema.safeParse(req.body);
            if (!parsed_body.success) {
                ResponseWriter.invalid_data(res, "Invalid column data provided");
                return;
            }

            const space = await prisma.space.findUnique({
                where: { id: parsed_body.data.space_id },
                select: { projectId: true },
            });
            if (!space) {
                ResponseWriter.not_found(res, "Space not found");
                return;
            }

            const role = await Access.project(user.id, space.projectId);
            if (!role || !Permissions.project(role, Action.project.manage_columns)) {
                ResponseWriter.not_authorized(
                    res,
                    "You dont have permissions to manage columns in this project",
                );
                return;
            }

            const column = await prisma.$transaction(async (tx) => {
                const last_column = await tx.customColumn.findFirst({
                    where: { spaceId: parsed_body.data.space_id },
                    orderBy: { order: "desc" },
                    select: { order: true },
                });

                return tx.customColumn.create({
                    data: {
                        spaceId: parsed_body.data.space_id,
                        label: parsed_body.data.label,
                        order: (last_column?.order ?? 0) + 1,
                    },
                    select: { id: true, spaceId: true, label: true, order: true },
                });
            });

            ResponseWriter.created(res, { column }, "Column created successfully");
        } catch (err) {
            ResponseWriter.system_error(res);
        }
    }
}
