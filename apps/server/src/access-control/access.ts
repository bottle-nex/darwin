import { prisma } from "@trymatcha/database";
import { OrgRole, ProjectRole, TeamRole } from "@trymatcha/types";
import { Permissions } from "@trymatcha/access-control";

export default class Access {
    static async org(userId: string, orgId: string): Promise<OrgRole | null> {
        const member = await prisma.orgMember.findUnique({
            where: { orgId_userId: { orgId, userId } },
            select: { role: true },
        });
        return member?.role ?? null;
    }

    static async project(userId: string, projectId: string): Promise<ProjectRole | null> {
        const [team_member, project] = await Promise.all([
            prisma.teamMember.findFirst({
                where: { userId, team: { projectId } },
                select: { team: { select: { projectRole: true } } },
            }),
            prisma.project.findUnique({
                where: { id: projectId },
                select: { ownerId: true, orgId: true },
            }),
        ]);

        if (team_member) return team_member.team.projectRole;

        if (!project) return null;
        if (project.ownerId === userId) return ProjectRole.Admin;

        const org_member = await prisma.orgMember.findUnique({
            where: { orgId_userId: { orgId: project.orgId, userId } },
            select: { role: true },
        });

        if (org_member && Permissions.has_implicit_project_access(org_member.role)) {
            return ProjectRole.Admin;
        }

        return null;
    }

    static async team(userId: string, teamId: string): Promise<TeamRole | null> {
        const member = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId } },
            select: { role: true },
        });
        return member?.role ?? null;
    }
}
