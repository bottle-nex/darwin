import { prisma } from "@trymatcha/database";
import { createHash } from "crypto";
import type { Request, Response } from "express";
import z from "zod";

import ResponseWriter from "../../services/service.response";

export default class GetInviteController {
    static get_invite_schema = z.object({
        token: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const { data, success } = GetInviteController.get_invite_schema.safeParse(req.params);
        if (!success) {
            ResponseWriter.invalid_data(res, "invalid token");
            return;
        }

        try {
            const user_email = req.user.email.toLowerCase();

            const token = createHash("sha256").update(data.token).digest("hex");

            const invitation = await prisma.invitation.findUnique({
                where: { token },
                select: {
                    email: true,
                    status: true,
                    expiresAt: true,
                    role: true,
                    invitedBy: { select: { name: true, email: true } },
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
            });

            if (!invitation) {
                ResponseWriter.not_found(res, "Invitation not found.");
                return;
            }

            const emailMatches = invitation.email.toLowerCase() === user_email;

            const res_body = {
                email: invitation.email,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
                org: invitation.organization,
                invitedBy: invitation.invitedBy,
                role: invitation.role,
                project: invitation.project,
                team: invitation.team ? { name: invitation.team.name } : null,
                teamRoleOnAccept: "Member",
                emailMatches,
                isExpired: invitation.expiresAt.getTime() <= Date.now(),
            };

            ResponseWriter.success(res, res_body, "invitation fetched");
            return;
        } catch (err) {
            console.error("error in GetInviteController", err);
            ResponseWriter.system_error(res);
        }
    }
}
