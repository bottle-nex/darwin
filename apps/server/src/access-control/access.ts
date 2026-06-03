import { OrgRole, prisma, ProjectRole, TeamRole } from "@trymatcha/database";
import Permissions from "./permissions";

export default class Access {

    static async org(userId: string, orgId: string): Promise<OrgRole | null> {
        const member = await prisma.orgMember.findUnique({
            where: {
                orgId_userId: { orgId, userId },
            },
            select: {
                role: true,
            },
        });

        return member?.role ?? null;
    }

    static async project(userId: string, projectId: string, orgId: string): Promise<ProjectRole | null> {

        // const (team_member, project, org_member) = await Promise.all([
        //     prisma.teamMember.findFirst({
        //         where: {
        //             userId, team: { projectId },
        //         },
        //         select: {
        //             team: { select: { projectRole: true } },
        //         },
        //     }),
        //     prisma.project.findUnique({
        //         where: { id: projectId },
        //         select: { ownerId: true },
        //     }),
        //     prisma.orgMember.findUnique({
        //         where: {
        //             orgId_userId: { orgId, userId },
        //         },
        //         select: {
        //             role: true,
        //         },
        //     }),
        // ]);

        const teamMember = await prisma.teamMember.findFirst({
            where: { userId, team: { projectId } },
            select: { team: { select: { projectRole: true } } },
        });

        if (teamMember) return teamMember.team.projectRole;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true, orgId: true },
        });

        if (!project) return null;
        if (project.ownerId === userId) return ProjectRole.Admin;

        const orgMember = await prisma.orgMember.findUnique({
            where: { orgId_userId: { orgId: project.orgId, userId } },
            select: { role: true },
        });

        if (orgMember && Permissions.has_implicit_project_access(orgMember.role)) {
            return ProjectRole.Admin;
        }

        return null;
    }

    static async team(userId: string, teamId: string): Promise<TeamRole | null> {

        const member = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: { teamId, userId },
            },
            select: {
                role: true,
            },
        });

        return member?.role ?? null;
    }

    // static async assert_action(userId: string, orgId: string, action: OrgAction): Promise<OrgRole | null> {
    //     const role = await this.get_role(userId, orgId);
    //     if (role === null) return null;
    //     if (!Permissions.org(role, action)) return null;
    //     return role;
    // }
}
