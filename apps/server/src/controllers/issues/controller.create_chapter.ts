import { Action, Permissions } from "@trymatcha/access-control";
import { Prisma, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

export default class ChapterCreateController {
    static body_schema = z.object({
        project_id: z.string().min(1),
        name: z.string().min(1).max(100),
        slug: z
            .string()
            .min(1)
            .max(50)
            .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = ChapterCreateController.body_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res, "Invalid chapter data provided");
            return;
        }

        const role = await Access.project(user.id, data.project_id);
        if (!role || !Permissions.project(role, Action.project.manage_columns)) {
            ResponseWriter.not_authorized(
                res,
                "You dont have permissions to manage chapters in this project",
            );
            return;
        }

        try {
            const chapter = await prisma.$transaction(async (tx) => {
                const last_chapter = await tx.chapter.findFirst({
                    where: { projectId: data.project_id },
                    orderBy: { order: "desc" },
                    select: { order: true },
                });

                return tx.chapter.create({
                    data: {
                        projectId: data.project_id,
                        name: data.name,
                        slug: data.slug,
                        order: (last_chapter?.order ?? 0) + 1,
                    },
                    select: { id: true, name: true, slug: true, order: true },
                });
            });

            ResponseWriter.created(res, { chapter }, "Chapter created successfully");
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                ResponseWriter.custom(
                    res,
                    false,
                    "SLUG_TAKEN",
                    "A chapter with this name already exists in this project.",
                    409,
                );
                return;
            }
            console.error("ChapterCreateController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
