import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";
import { prisma } from "@trymatcha/database";

const params_schema = z.object({
    project_id: z.string(),
});

export default async function get_project_controller(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid project id");
            return;
        }

        const { project_id } = parsed.data;

        const project_role = await Access.project(user.id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to this project");
            return;
        }

        const project = await prisma.project.findUnique({
            where: { id: project_id },
            select: {
                id: true,
                name: true,
                slug: true,
                summary: true,
                description: true,
                githubRepoFullName: true,
                githubRepoUrl: true,
                githubDefaultBranch: true,
                color: true,
                ownerId: true,
                createdAt: true,
                tourCompleted: true,
                updatedAt: true,
                planMd: true,
                planStatus: true,
                planGeneratedAt: true,
                teams: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        members: {
                            where: { userId: user.id },
                            select: { role: true },
                        },
                    },
                },
            },
        });

        if (!project) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }

        ResponseWriter.success(res, {
            ...project,
            teams: project.teams.map(({ members, ...team }) => ({
                ...team,
                viewerRole: members[0]?.role ?? null,
            })),
            viewerRole: project_role,
        });
    } catch (error) {
        console.error("error in get_project_controller:", error);
        ResponseWriter.system_error(res);
    }
}
