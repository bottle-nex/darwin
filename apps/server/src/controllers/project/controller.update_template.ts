import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import { prisma, Prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { icon_schema } from "./controller.create_template";

const body_schema = z.object({
    name: z.string().min(1).max(60).optional(),
    summary: z.string().max(200).optional(),
    description: z.string().min(1).max(20000).optional(),
    icon: icon_schema.optional(),
    is_default: z.boolean().optional(),
});

export default async function update_template_controller(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = body_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res, "Invalid data provided");
            return;
        }

        const project_id = req.params.project_id as string;
        if (!project_id) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }

        const template_id = req.params.template_id as string;
        if (!template_id) {
            ResponseWriter.not_found(res, "Issue template not found");
            return;
        }

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.manage_templates)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to manage this project's issue templates",
            );
            return;
        }

        const existing = await prisma.issueTemplate.findUnique({
            where: { id: template_id },
            select: { projectId: true },
        });
        if (!existing || existing.projectId !== project_id) {
            ResponseWriter.not_found(res, "Issue template not found");
            return;
        }

        const template = await prisma.$transaction(async (tx) => {
            if (data.is_default === true) {
                await tx.issueTemplate.updateMany({
                    where: {
                        projectId: project_id,
                        isDefault: true,
                        id: { not: template_id },
                    },
                    data: { isDefault: false },
                });
            }

            return tx.issueTemplate.update({
                where: { id: template_id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.summary !== undefined ? { summary: data.summary } : {}),
                    ...(data.description !== undefined ? { description: data.description } : {}),
                    ...(data.icon !== undefined ? { icon: data.icon } : {}),
                    ...(data.is_default !== undefined ? { isDefault: data.is_default } : {}),
                },
                select: {
                    id: true,
                    name: true,
                    summary: true,
                    description: true,
                    icon: true,
                    isDefault: true,
                    createdAt: true,
                },
            });
        });

        ResponseWriter.success(res, template, "Issue template updated");
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            ResponseWriter.custom(
                res,
                false,
                "TEMPLATE_EXISTS",
                "A template with this name already exists.",
                409,
            );
            return;
        }
        console.error("update_template_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
