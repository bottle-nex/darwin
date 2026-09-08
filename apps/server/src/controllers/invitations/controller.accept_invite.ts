import { InvitationStatus, OrgRole, prisma, TeamRole } from "@trydarwin/database";
import { createHash } from "crypto";
import type { Request, Response } from "express";
import { z } from "zod";

import { server_services } from "../..";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    token: z.string().min(1),
});

export default class AcceptInviteController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const userId = req.user.id;
            const userEmail = req.user.email.toLowerCase();

            const token = createHash("sha256").update(parsed.data.token).digest("hex");

            const invitation = await prisma.invitation.findUnique({
                where: { token },
                select: {
                    id: true,
                    email: true,
                    orgId: true,
                    projectId: true,
                    role: true,
                    teamId: true,
                    status: true,
                    expiresAt: true,
                    invitedById: true,
                },
            });

            if (!invitation) {
                return ResponseWriter.not_found(res, "invitation not found");
            }

            if (invitation.email.toLowerCase() !== userEmail) {
                return ResponseWriter.not_authorized(res, "this invitation is not for you");
            }
            if (invitation.status !== InvitationStatus.Pending) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "INVITE_NOT_PENDING",
                    "This invitation is no longer pending.",
                    409,
                );
            }
            if (invitation.expiresAt.getTime() <= Date.now()) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "INVITE_EXPIRED",
                    "This invitation has expired.",
                    410,
                );
            }

            await prisma.$transaction(async (tx) => {
                await tx.orgMember.upsert({
                    where: { orgId_userId: { orgId: invitation.orgId, userId } },
                    create: { orgId: invitation.orgId, userId, role: OrgRole.Member },
                    update: {},
                });

                if (invitation.projectId && invitation.role) {
                    await tx.projectMember.upsert({
                        where: {
                            projectId_userId: { projectId: invitation.projectId, userId },
                        },
                        create: {
                            projectId: invitation.projectId,
                            userId,
                            role: invitation.role,
                        },
                        update: { role: invitation.role },
                    });
                }

                if (invitation.teamId) {
                    await tx.teamMember.upsert({
                        where: { teamId_userId: { teamId: invitation.teamId, userId } },
                        create: { teamId: invitation.teamId, userId, role: TeamRole.Member },
                        update: {},
                    });
                }

                await tx.invitation.update({
                    where: { id: invitation.id },
                    data: { status: InvitationStatus.Accepted, userId },
                });
            });

            if (invitation.invitedById !== userId) {
                await server_services.notifications.enqueue({
                    action: "invite.accepted",
                    invitationId: invitation.id,
                    recipientId: invitation.invitedById,
                    accepterId: userId,
                });
            }

            if (invitation.projectId && invitation.role) {
                await server_services.notifications.enqueue({
                    action: "member.added_to_project",
                    projectId: invitation.projectId,
                    recipientId: userId,
                    actorId: invitation.invitedById,
                    role: invitation.role,
                });
            }

            if (invitation.teamId) {
                await server_services.notifications.enqueue({
                    action: "member.added_to_team",
                    teamId: invitation.teamId,
                    recipientId: userId,
                    actorId: invitation.invitedById,
                });
            }

            return ResponseWriter.success(
                res,
                { orgId: invitation.orgId, teamId: invitation.teamId },
                "invitation accepted",
            );
        } catch (error) {
            console.error("error in AcceptInviteController", error);
            ResponseWriter.system_error(res);
        }
    }
}
