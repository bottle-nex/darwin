import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import { prisma } from "@trymatcha/database";
import { ProjectRole } from "@trymatcha/types";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

const PROJECT_ROLE_RANK: Record<ProjectRole, number> = {
    [ProjectRole.Admin]: 4,
    [ProjectRole.Maintain]: 3,
    [ProjectRole.Write]: 2,
    [ProjectRole.Triage]: 1,
    [ProjectRole.Read]: 0,
};

export default async function list_members_controller(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const project_id = req.params.project_id as string;
        if (!project_id) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You don't have access to this project");
            return;
        }

        const project = await prisma.project.findUnique({
            where: { id: project_id },
            select: {
                owner: { select: { id: true, name: true, email: true, image: true } },
                teams: {
                    select: {
                        projectRole: true,
                        members: {
                            select: {
                                user: {
                                    select: { id: true, name: true, email: true, image: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!project) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }

        type MemberUser = { id: string; name: string | null; email: string; image: string | null };
        const byUser = new Map<string, { user: MemberUser; rank: number; role: ProjectRole }>();

        const consider = (u: MemberUser, projectRole: ProjectRole) => {
            const rank = PROJECT_ROLE_RANK[projectRole];
            const existing = byUser.get(u.id);
            if (!existing || rank > existing.rank) {
                byUser.set(u.id, { user: u, rank, role: projectRole });
            }
        };

        if (project.owner) consider(project.owner, ProjectRole.Admin);
        for (const team of project.teams) {
            for (const member of team.members) consider(member.user, team.projectRole);
        }

        const members = [...byUser.values()].map(({ user, role: memberRole }) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: memberRole,
        }));

        ResponseWriter.success(res, { members });
    } catch (err) {
        console.error("list_members_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
