import { Action, Permissions } from "@trymatcha/access-control";
import { InvitationStatus, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import { z } from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    invitationId: z.string(),
});

export default class RevokeInviteController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const userId = req.user.id;

            const invitation = await prisma.invitation.findUnique({
                where: { id: parsed.data.invitationId },
                select: { id: true, orgId: true, projectId: true, teamId: true, status: true },
            });
            if (!invitation) {
                return ResponseWriter.not_found(res, "invitation not found");
            }

            // Revoking mirrors the permission model of sending: team-scoped invites
            // are project management, org-scoped invites are org member management.
            if (invitation.teamId) {
                const role = invitation.projectId
                    ? await Access.project(userId, invitation.projectId)
                    : null;
                if (!role || !Permissions.project(role, Action.project.manage_team)) {
                    return ResponseWriter.not_authorized(res, "insufficient permissions", 403);
                }
            } else {
                const role = await Access.org(userId, invitation.orgId);
                if (!role || !Permissions.org(role, Action.org.invite_member)) {
                    return ResponseWriter.not_authorized(res, "insufficient permissions", 403);
                }
            }

            // Only a pending invite can be rescinded; an accepted one is a real
            // membership that must be removed through member management instead.
            if (invitation.status !== InvitationStatus.Pending) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "INVITE_NOT_PENDING",
                    "This invitation is no longer pending.",
                    409,
                );
            }

            await prisma.invitation.delete({ where: { id: invitation.id } });

            return ResponseWriter.success(res, null, "invitation revoked");
        } catch (error) {
            console.error("error in RevokeInviteController", error);
            ResponseWriter.system_error(res);
        }
    }
}
