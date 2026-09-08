import { InvitationStatus, prisma } from "@trydarwin/database";
import { createHash } from "crypto";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    token: z.string().min(1),
});

export default class RejectInviteController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const userEmail = req.user.email.toLowerCase();
            const token = createHash("sha256").update(parsed.data.token).digest("hex");

            const invitation = await prisma.invitation.findUnique({
                where: { token },
                select: { id: true, email: true, status: true },
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

            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: InvitationStatus.Rejected },
            });

            return ResponseWriter.success(res, null, "invitation rejected");
        } catch (error) {
            console.error("error in RejectInviteController", error);
            ResponseWriter.system_error(res);
        }
    }
}
