import { Action, Permissions } from "@trymatcha/access-control";
import { Prisma, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import { SPACE_SELECT } from "../../services/service.board-issues";
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
            const space = await prisma.$transaction(async (tx) => {
                const last_space = await tx.space.findFirst({
                    where: { projectId: data.project_id },
                    orderBy: { order: "desc" },
                    select: { order: true },
                });

                return tx.space.create({
                    data: {
                        projectId: data.project_id,
                        name: data.name,
                        slug: data.slug,
                        description: data.description ?? null,
                        startDate: data.start_date ?? null,
                        targetDate: data.target_date ?? null,
                        order: (last_space?.order ?? 0) + 1,
                        icon: data.icon ?? undefined,
                    },
                    select: SPACE_SELECT,
                });
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
