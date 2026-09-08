import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import BoardItemService from "../../services/service.board-items";
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

            const column = await BoardItemService.create_column(
                parsed_body.data.space_id,
                parsed_body.data.label,
            );

            ResponseWriter.created(res, { column }, "Column created successfully");
        } catch (err) {
            ResponseWriter.system_error(res);
        }
    }
}
