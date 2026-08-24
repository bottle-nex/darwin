import { Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { OrgRole, TeamRole } from "@trymatcha/types";
import { ProjectRole } from "@trymatcha/types";

const PROJECT_ROLE_RANK: Record<ProjectRole, number> = {
    [ProjectRole.Admin]: 4,
    [ProjectRole.Maintain]: 3,
    [ProjectRole.Write]: 2,
    [ProjectRole.Triage]: 1,
    [ProjectRole.Read]: 0,
};

export default class Access {
    static async org(userId: string, orgId: string): Promise<OrgRole | null> {
        const member = await prisma.orgMember.findUnique({
            where: { orgId_userId: { orgId, userId } },
            select: { role: true },
        });
        return member?.role ?? null;
    }

    static async project(userId: string, projectId: string): Promise<ProjectRole | null> {
        const [project_member, project] = await Promise.all([
            prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId, userId } },
                select: { role: true },
            }),
            prisma.project.findUnique({
                where: { id: projectId },
                select: { ownerId: true, orgId: true },
            }),
        ]);

        if (!project) return null;

        const roles: ProjectRole[] = [];
        if (project_member) roles.push(project_member.role);
        if (project.ownerId === userId) roles.push(ProjectRole.Admin);

        const org_member = await prisma.orgMember.findUnique({
            where: { orgId_userId: { orgId: project.orgId, userId } },
            select: { role: true },
        });
        if (org_member && Permissions.has_implicit_project_access(org_member.role)) {
            roles.push(ProjectRole.Admin);
        }

        if (roles.length === 0) return null;

        return roles.reduce((highest, role) =>
            PROJECT_ROLE_RANK[role] > PROJECT_ROLE_RANK[highest] ? role : highest,
        );
    }

    static async team(userId: string, teamId: string): Promise<TeamRole | null> {
        const member = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId } },
            select: { role: true },
        });
        return member?.role ?? null;
    }
}
