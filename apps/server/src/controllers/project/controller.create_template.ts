import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import { prisma, Prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { icon_schema } from "./icon.schema";

const body_schema = z.object({
    name: z.string().min(1).max(60),
    description: z.string().min(1).max(20000),
    icon: icon_schema.optional(),
    is_default: z.boolean().optional(),
});

export default async function create_template_controller(req: Request, res: Response) {
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

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.manage_templates)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to manage this project's issue templates",
            );
            return;
        }
        const template = await prisma.$transaction(async (tx) => {
            if (data.is_default) {
                await tx.issueTemplate.updateMany({
                    where: { projectId: project_id, isDefault: true },
                    data: { isDefault: false },
                });
            }

            return tx.issueTemplate.create({
                data: {
                    projectId: project_id,
                    name: data.name,
                    description: data.description,
                    icon: data.icon,
                    isDefault: data.is_default ?? false,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    icon: true,
                    isDefault: true,
                    createdAt: true,
                },
            });
        });

        ResponseWriter.created(res, template, "Issue template created");
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
        console.error("create_template_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
