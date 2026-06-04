import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";
import { Prisma, prisma } from "@trymatcha/database";

const body_schema = z.object({
    project_id: z.string(),
    name: z.string().min(1),
    slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    description: z.string().optional(),
    project_role: z.enum(["Admin", "Maintain", "Write", "Triage", "Read"]),
});

export default async function add_team_controller(req: Request, res: Response) {
    try {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid data provided");
            return;
        }

        const { project_id, name, slug, description, project_role } = parsed.data;
        const user_id = req.user.id;

        const role = await Access.project(user_id, project_id);
        if (!role || !Permissions.project(role, Action.project.create_team)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to create teams in this project",
            );
            return;
        }

        const team = await prisma.team.create({
            data: { projectId: project_id, name, slug, description, projectRole: project_role },
            select: { id: true, name: true, slug: true, projectRole: true },
        });

        ResponseWriter.created(res, team, "Team created successfully");
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            ResponseWriter.custom(res, false, "SLUG_TAKEN", "That slug is already taken.", 409);
            return;
        }
        console.error("error in add_team_controller:", error);
        ResponseWriter.system_error(res);
    }
}
