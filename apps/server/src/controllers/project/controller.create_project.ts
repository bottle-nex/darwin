import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import { Access, Action, Permissions } from "@trymatcha/access-control";
import { Prisma, prisma } from "@trymatcha/database";

const body_schema = z.object({
    org_id: z.string(),
    name: z.string().min(1),
    slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    description: z.string().optional(),
});

export default async function create_project_controller(req: Request, res: Response) {
    try {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid data provided");
            return;
        }

        const { org_id, name, slug, description } = parsed.data;
        const user_id = req.user.id;

        const org_role = await Access.org(user_id, org_id);
        if (!org_role || !Permissions.org(org_role, Action.org.create_project)) {
            ResponseWriter.not_authorized(res, "You don't have permission to create projects in this org");
            return;
        }

        const project = await prisma.project.create({
            data: {
                orgId: org_id,
                name,
                slug,
                description,
                ownerId: user_id,
                createdById: user_id,
            },
            select: { id: true, name: true, slug: true },
        });

        ResponseWriter.created(res, project, "Project created successfully");
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            ResponseWriter.custom(res, false, "SLUG_TAKEN", "That slug is already taken.", 409);
            return;
        }
        console.error("error in create_project_controller:", error);
        ResponseWriter.system_error(res);
    }
}
