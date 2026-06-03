import { Request, Response } from "express";
import { z } from "zod";
import { Prisma, prisma, ProjectRole, TeamRole } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    projectId: z.string(),
    name: z.string().min(1),
    slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    description: z.string().optional(),
});

export default class CreateTeamController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const data = parsed.data;
            const userId = req.user.id;

            const project = await prisma.project.findUnique({
                where: { id: data.projectId },
                select: { id: true },
            });
            if (!project) {
                return ResponseWriter.not_found(res, "project not found");
            }

            const team = await prisma.team.create({
                data: {
                    projectId: data.projectId,
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    projectRole: ProjectRole.Read,
                    members: {
                        create: {
                            userId,
                            role: TeamRole.Maintainer,
                        },
                    },
                },
                select: {
                    id: true,
                },
            });

            ResponseWriter.created(res, team, "Team created successfully.");
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                return ResponseWriter.custom(
                    res,
                    false,
                    "SLUG_TAKEN",
                    "A team with this name already exists in this project.",
                    409,
                );
            }
            console.error("error in create team controller", error);
            ResponseWriter.system_error(res);
        }
    }
}
