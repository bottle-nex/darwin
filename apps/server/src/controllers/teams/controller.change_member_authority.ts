import { Request, Response } from "express";
import z from "zod";
import { prisma } from "@trymatcha/database";
import { TeamRole } from "@trymatcha/types";
import { Action, Permissions } from "@trymatcha/access-control";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";

const body_schema = z.object({
    teamId: z.string().nonempty(),
    memberId: z.string().nonempty(),
    role: z.enum(["Maintainer", "Member"]),
});

export default class ChangeMemberAuthority {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);

        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const { teamId, memberId, role } = parsed.data;

            if (memberId === req.user.id) {
                return ResponseWriter.success(
                    res,
                    "CALLING_YOURSELF",
                    "can't change your own authority",
                    undefined,
                );
            }

            const team = await prisma.team.findUnique({
                where: { id: teamId },
                select: { projectId: true, project: { select: { orgId: true } } },
            });
            if (!team) {
                return ResponseWriter.not_found(res, "team not found");
            }

            const { orgId } = team.project;

            const [teamRole, projectRole, orgRole] = await Promise.all([
                Access.team(req.user.id, teamId),
                Access.project(req.user.id, team.projectId),
                Access.org(req.user.id, orgId),
            ]);

            const allowed =
                (teamRole && Permissions.team(teamRole, Action.team.change_member_role)) ||
                (projectRole && Permissions.project(projectRole, Action.project.manage_team)) ||
                (orgRole && Permissions.org(orgRole, Action.org.change_member_role));

            if (!allowed) {
                return ResponseWriter.not_authorized(res, "insufficient permissions", 403);
            }

            const target = await prisma.teamMember.findUnique({
                where: { teamId_userId: { teamId, userId: memberId } },
                select: { id: true },
            });
            if (!target) {
                return ResponseWriter.not_found(res, "member not found in team");
            }

            await prisma.teamMember.update({
                where: { teamId_userId: { teamId, userId: memberId } },
                data: { role: role as TeamRole },
            });

            return ResponseWriter.success(res, { memberId, role }, "member role updated");
        } catch (error) {
            console.error("Error in ChangeMemberAuthority: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
