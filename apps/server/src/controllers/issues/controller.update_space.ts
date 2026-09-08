import { Action, Permissions } from "@trydarwin/access-control";
import { Prisma, prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import { SPACE_SELECT } from "../../services/service.board-issues";
import ResponseWriter from "../../services/service.response";
import { icon_schema } from "../project/icon.schema";

export default class SpaceUpdateController {
    static params_schema = z.object({ id: z.string().min(1) });

    static body_schema = z.object({
        name: z.string().min(1).max(100).optional(),
        slug: z
            .string()
            .min(1)
            .max(50)
            .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only")
            .optional(),
        description: z.string().max(280).nullish(),
        start_date: z.coerce.date().nullish(),
        target_date: z.coerce.date().nullish(),
        icon: icon_schema.nullish(),
        order: z.number().int().optional(),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success: params_ok } =
            SpaceUpdateController.params_schema.safeParse(req.params);
        const { data: body_data, success: body_ok } = SpaceUpdateController.body_schema.safeParse(
            req.body,
        );
        if (!params_ok || !body_ok) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const space = await prisma.space.findUnique({
                where: { id: params_data.id },
                select: { projectId: true, startDate: true, targetDate: true },
            });
            if (!space) {
                ResponseWriter.not_found(res, "Space not found");
                return;
            }

            const role = await Access.project(user.id, space.projectId);
            if (!role || !Permissions.project(role, Action.project.manage_columns)) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            // Either date can arrive on its own, so the order has to hold against
            // what is already stored — not just against whatever this body carries.
            const start_date =
                body_data.start_date === undefined ? space.startDate : body_data.start_date;
            const target_date =
                body_data.target_date === undefined ? space.targetDate : body_data.target_date;
            if (start_date && target_date && start_date > target_date) {
                ResponseWriter.invalid_data(res, "Start date must be on or before the end date");
                return;
            }

            const updated = await prisma.space.update({
                where: { id: params_data.id },
                data: {
                    name: body_data.name,
                    slug: body_data.slug,
                    description: body_data.description,
                    startDate: body_data.start_date,
                    targetDate: body_data.target_date,
                    order: body_data.order,
                    icon:
                        body_data.icon === undefined
                            ? undefined
                            : (body_data.icon ?? Prisma.DbNull),
                },
                select: SPACE_SELECT,
            });

            ResponseWriter.success(res, { space: updated }, "Space updated");
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                ResponseWriter.custom(
                    res,
                    false,
                    "SLUG_TAKEN",
                    "A space with this name already exists in this project.",
                    409,
                );
                return;
            }
            console.error("SpaceUpdateController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
