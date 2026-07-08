import { InvitationStatus, prisma } from "@trymatcha/database";
import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";

export default class ListInvitesController {
    static async process(req: Request, res: Response) {
        try {
            const user_email = req.user.email.toLowerCase();

            const invitations = await prisma.invitation.findMany({
                where: {
                    email: user_email,
                    status: InvitationStatus.Pending,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                select: {
                    id: true,
                    email: true,
                    status: true,
                    expiresAt: true,
                    createdAt: true,
                    role: true,
                    invitedBy: true,
                    organization: {
                        select: {
                            name: true,
                            slug: true,
                        },
                    },
                    project: {
                        select: {
                            name: true,
                            slug: true,
                        },
                    },
                    team: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            });

            const res_body = invitations.map((i) => ({
                id: i.id,
                email: i.email,
                status: i.status,
                expiresAt: i.expiresAt,
                createdAt: i.createdAt,
                invitedBy: i.invitedBy,
                role: i.role,
                organization: i.organization
                    ? {
                          name: i.organization.name,
                          slug: i.organization.slug,
                      }
                    : null,
                project: i.project,
                team: i.team ? { name: i.team.name } : null,
                teamRoleOnAccept: "Member",
            }));

            ResponseWriter.success(res, res_body, "invitatons fetched");
            return;
        } catch (err) {
            console.error("error in ListInvitationsController", err);
            ResponseWriter.system_error(res);
        }
    }
}
