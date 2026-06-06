import { Request, Response } from "express";
import { z } from "zod";
import { createHash } from "crypto";
import { InvitationStatus, OrgRole, prisma, TeamRole } from "@trymatcha/database";
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
                    teamId: true,
                    status: true,
                    expiresAt: true,
                },
            });

            if (!invitation) {
                return ResponseWriter.not_found(res, "invitation not found");
            }

            // The invite is bound to an email (the recipient may not have had an
            // account when it was sent), so authorize on the accepting user's
            // verified email rather than a pre-assigned userId.
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
            // Expiry is enforced at read time, not by a background job.
            if (invitation.expiresAt.getTime() <= Date.now()) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "INVITE_EXPIRED",
                    "This invitation has expired.",
                    410,
                );
            }

            // Create the membership and consume the invite atomically. upsert keeps it
            // idempotent if the user somehow already holds the membership.
            await prisma.$transaction(async (tx) => {
                // Org membership is the umbrella: a team member must also be an org
                // member, so ensure the OrgMember row exists for either invite type.
                await tx.orgMember.upsert({
                    where: { orgId_userId: { orgId: invitation.orgId, userId } },
                    create: { orgId: invitation.orgId, userId, role: OrgRole.Member },
                    update: {},
                });

                if (invitation.teamId) {
                    await tx.teamMember.upsert({
                        where: { teamId_userId: { teamId: invitation.teamId, userId } },
                        create: { teamId: invitation.teamId, userId, role: TeamRole.Member },
                        update: {},
                    });
                }

                await tx.invitation.update({
                    where: { id: invitation.id },
                    // Stamp the now-known account onto the invite (it may have been
                    // sent before the recipient signed up).
                    data: { status: InvitationStatus.Accepted, userId },
                });
            });

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
