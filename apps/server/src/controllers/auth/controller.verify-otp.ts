import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import OtpService from "../../services/service.otp";
import { signSessionJwt } from "../../services/service.jwt";

const body_schema = z.object({
    email: z.email(),
    code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

/**
 * HTTP controller for verifying OTP codes and establishing a session.
 */
export default class OtpVerifyController {
    /**
     * Handle `POST /auth/otp/verify`: validate the email + 6-digit code, check it
     * against the stored OTP, and on success upsert the user (marking their email
     * verified) and return a signed session JWT.
     *
     * The upsert makes first verification double as account creation, so no separate
     * sign-up step is needed.
     *
     * Responses: `200` `{ user, token }` · `429` `OTP_LOCKED` · `400` `OTP_EXPIRED` /
     * `OTP_INVALID` / invalid body · `500` on error.
     */
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "Email and 6-digit code required");
        }
        const email = parsed.data.email.toLowerCase();
        const { code } = parsed.data;

        try {
            const result = await OtpService.verify_otp(email, code);
            if (!result.ok) {
                if (result.reason === "locked") {
                    return ResponseWriter.custom(
                        res,
                        false,
                        "OTP_LOCKED",
                        "Too many attempts. Request a new code.",
                        429,
                    );
                }
                if (result.reason === "expired") {
                    return ResponseWriter.custom(
                        res,
                        false,
                        "OTP_EXPIRED",
                        "Code expired. Request a new one.",
                        400,
                    );
                }
                return ResponseWriter.custom(res, false, "OTP_INVALID", "Invalid code", 400);
            }

            const user = await prisma.user.upsert({
                where: { email },
                create: { email, emailVerified: new Date() },
                update: { emailVerified: new Date() },
                select: { id: true, email: true, name: true },
            });

            const token = signSessionJwt({ id: user.id, name: user.name ?? "", email: user.email });

            return ResponseWriter.success(res, { user, token }, "OTP verified");
        } catch (err) {
            console.error("[otp-verify]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
