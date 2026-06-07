import { Request, Response } from "express";
import { z } from "zod";
import { Prisma, prisma, ProjectRole } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

const body_schema = z.object({
    teamId: z.string(),
    name: z.string().min(1),
    slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    description: z.string().optional(),
    projectRole: z.enum(ProjectRole),
});

export default class UpdateTeamController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const { teamId, name, slug, description, projectRole } = parsed.data;

            const team = await prisma.team.findUnique({
                where: { id: teamId },
                select: { projectId: true },
            });
            if (!team) {
                return ResponseWriter.not_found(res, "team not found");
            }

            // Managing a team (incl. its role) is project-level — project Admins only.
            const role = await Access.project(req.user.id, team.projectId);
            if (!role || !Permissions.project(role, Action.project.manage_team)) {
                return ResponseWriter.not_authorized(res, "insufficient permissions", 403);
            }

            await prisma.team.update({
                where: { id: teamId },
                data: {
                    name,
                    slug,
                    description,
                    projectRole,
                },
            });

            return ResponseWriter.success(res, {}, "Team updated successfully!");
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2002") {
                    return ResponseWriter.custom(
                        res,
                        false,
                        "SLUG_TAKEN",
                        "A team with this slug already exists in this project.",
                        409,
                    );
                }
                if (error.code === "P2025") {
                    return ResponseWriter.not_found(res, "team not found");
                }
            }
            console.error("failed in UpdateTeamController", error);
            return ResponseWriter.system_error(res);
        }
    }
}
