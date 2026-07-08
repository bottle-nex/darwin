import { Request, Response } from "express";
import { z } from "zod";
import { InvitationStatus, prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

const params_schema = z.object({
    teamId: z.string(),
});

export default class GetTeamMembersController {
    static async process(req: Request, res: Response) {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid team id");
            return;
        }

        try {
            const { teamId } = parsed.data;
            const userId = req.user.id;

            const team = await prisma.team.findUnique({
                where: { id: teamId },
                select: { projectId: true },
            });
            if (!team) {
                ResponseWriter.not_found(res, "Team not found");
                return;
            }

            const role = await Access.project(userId, team.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You don't have access to this team");
                return;
            }

            const [members, pendingInvites] = await Promise.all([
                prisma.teamMember.findMany({
                    where: { teamId },
                    select: {
                        id: true,
                        role: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                }),
                prisma.invitation.findMany({
                    where: {
                        teamId,
                        status: InvitationStatus.Pending,
                    },
                    select: {
                        id: true,
                        email: true,
                        status: true,
                        invitedBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                        createdAt: true,
                        expiresAt: true,
                    },
                }),
            ]);

            const projectMembers = await prisma.projectMember.findMany({
                where: {
                    projectId: team.projectId,
                    userId: { in: members.map((m) => m.user.id) },
                },
                select: { userId: true, role: true },
            });
            const roleByUser = new Map(projectMembers.map((pm) => [pm.userId, pm.role]));

            const membersWithProjectRole = members.map((member) => ({
                ...member,
                projectRole: roleByUser.get(member.user.id) ?? null,
            }));

            const updatedPendingInvites = pendingInvites.map((invite) => ({
                id: invite.id,
                invitedBy: {
                    id: invite.invitedBy.id,
                    name: invite.invitedBy.name,
                    email: invite.invitedBy.email,
                    image: invite.invitedBy.image,
                },
                status: invite.status,
                sentAt: invite.createdAt,
                expiresAt: invite.expiresAt,
                user: {
                    email: invite.email,
                },
            }));

            ResponseWriter.success(res, {
                members: membersWithProjectRole,
                pendingInvites: updatedPendingInvites,
                viewerRole: role,
            });
        } catch (error) {
            console.error("error in get_team_members controller:", error);
            ResponseWriter.system_error(res);
        }
    }
}
