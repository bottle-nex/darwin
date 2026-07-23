import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";
import { Prisma, prisma } from "@trymatcha/database";

const body_schema = z.object({
    project_id: z.string(),
    name: z.string().min(1).optional(),
    slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only")
        .optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    plan_md: z.string().optional(),
    tour_completed: z.boolean().optional(),
    kanban_option_view: z.enum(["FLAT", "GROUPED"]).optional(),
});

export default async function update_project_controller(req: Request, res: Response) {
    try {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid data provided");
            return;
        }

        const {
            project_id,
            name,
            slug,
            summary,
            description,
            plan_md,
            tour_completed,
            kanban_option_view,
        } = parsed.data;
        const user_id = req.user.id;

        const project_role = await Access.project(user_id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.update)) {
            ResponseWriter.not_authorized(res, "You don't have permission to update this project");
            return;
        }

        await prisma.project.update({
            where: { id: project_id },
            data: {
                name,
                slug,
                summary,
                description,
                planMd: plan_md,
                tourCompleted: tour_completed,
                ...(kanban_option_view && {
                    projectConfig: {
                        upsert: {
                            create: { kanbanOptionView: kanban_option_view },
                            update: { kanbanOptionView: kanban_option_view },
                        },
                    },
                }),
            },
        });

        ResponseWriter.success(res, {}, "Project updated successfully");
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                ResponseWriter.custom(res, false, "SLUG_TAKEN", "That slug is already taken.", 409);
                return;
            }
            if (error.code === "P2025") {
                ResponseWriter.not_found(res, "Project not found");
                return;
            }
        }
        console.error("error in update_project_controller:", error);
        ResponseWriter.system_error(res);
    }
}
