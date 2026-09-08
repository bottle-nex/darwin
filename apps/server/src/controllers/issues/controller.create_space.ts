import { Action, Permissions } from "@trydarwin/access-control";
import { Prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import BoardItemService from "../../services/service.board-items";
import ResponseWriter from "../../services/service.response";
import { icon_schema } from "../project/icon.schema";

export default class SpaceCreateController {
    static body_schema = z
        .object({
            project_id: z.string().min(1),
            name: z.string().min(1).max(100),
            slug: z
                .string()
                .min(1)
                .max(50)
                .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
            description: z.string().max(280).nullish(),
            start_date: z.coerce.date().nullish(),
            target_date: z.coerce.date().nullish(),
            icon: icon_schema.nullish(),
        })
        .refine(
            (data) => !data.start_date || !data.target_date || data.start_date <= data.target_date,
            {
                message: "Start date must be on or before the end date",
                path: ["target_date"],
            },
        );

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = SpaceCreateController.body_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res, "Invalid space data provided");
            return;
        }

        const role = await Access.project(user.id, data.project_id);
        if (!role || !Permissions.project(role, Action.project.manage_columns)) {
            ResponseWriter.not_authorized(
                res,
                "You dont have permissions to manage spaces in this project",
            );
            return;
        }

        try {
            const space = await BoardItemService.create_space(data.project_id, {
                name: data.name,
                slug: data.slug,
                description: data.description,
                start_date: data.start_date,
                target_date: data.target_date,
                icon: data.icon ?? undefined,
            });

            ResponseWriter.created(res, { space }, "Space created successfully");
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
            console.error("SpaceCreateController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
