import { Action, Permissions } from "@trymatcha/access-control";
import { Prisma, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

export default class ChapterUpdateController {
    static params_schema = z.object({ id: z.string().min(1) });

    static body_schema = z.object({
        name: z.string().min(1).max(100).optional(),
        slug: z
            .string()
            .min(1)
            .max(50)
            .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only")
            .optional(),
        order: z.number().int().optional(),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success: params_ok } =
            ChapterUpdateController.params_schema.safeParse(req.params);
        const { data: body_data, success: body_ok } = ChapterUpdateController.body_schema.safeParse(
            req.body,
        );
        if (!params_ok || !body_ok) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const chapter = await prisma.chapter.findUnique({
                where: { id: params_data.id },
                select: { projectId: true },
            });
            if (!chapter) {
                ResponseWriter.not_found(res, "Chapter not found");
                return;
            }

            const role = await Access.project(user.id, chapter.projectId);
            if (!role || !Permissions.project(role, Action.project.manage_columns)) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            const updated = await prisma.chapter.update({
                where: { id: params_data.id },
                data: { name: body_data.name, slug: body_data.slug, order: body_data.order },
                select: { id: true, name: true, slug: true, order: true },
            });

            ResponseWriter.success(res, { chapter: updated }, "Chapter updated");
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
            console.error("ChapterUpdateController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
