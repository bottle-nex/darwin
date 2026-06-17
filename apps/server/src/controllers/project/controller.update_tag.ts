import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import { prisma, Prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

const body_schema = z.object({
    name: z.string().min(1).max(50).optional(),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
});

export default async function update_tag_controller(req: Request, res: Response) {
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

        const tag_id = req.params.tag_id as string;
        if (!tag_id) {
            ResponseWriter.not_found(res, "Tag not found");
            return;
        }

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.manage_tags)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to manage this project's tags",
            );
            return;
        }

        const existing = await prisma.tag.findUnique({
            where: { id: tag_id },
            select: { projectId: true },
        });
        if (!existing || existing.projectId !== project_id) {
            ResponseWriter.not_found(res, "Tag not found");
            return;
        }

        const tag = await prisma.tag.update({
            where: { id: tag_id },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.color !== undefined ? { color: data.color } : {}),
            },
            select: { id: true, name: true, color: true, createdAt: true },
        });

        ResponseWriter.success(res, tag, "Tag updated");
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            ResponseWriter.custom(
                res,
                false,
                "TAG_EXISTS",
                "A tag with this name already exists.",
                409,
            );
            return;
        }
        console.error("update_tag_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
