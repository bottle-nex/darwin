import type { Request, Response } from "express";
import z from "zod";

import { sendOtpEmail } from "../../services/service.email";
import OtpService from "../../services/service.otp";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    email: z.email(),
});

export default class GenerateOtpController {
    /**
     * Handle `POST /auth/otp/request`: validate the email, enforce the per-email
     * cooldown, generate and store a fresh code, then dispatch it by email.
     *
     * Delivery is fire-and-forget so the response is not blocked on the mail provider;
     * a send failure is logged and the stored code is left to expire on its own TTL.
     * Always responds success once the code is stored (it does not leak whether mail
     * delivery succeeded).
     *
     * Responses: `200` sent · `429` `OTP_COOLDOWN` · `400` invalid email · `500` on error.
     */
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "Valid email required");
        }
        const email = parsed.data.email.toLowerCase();

        try {
            if (await OtpService.is_cooldown(email)) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "OTP_COOLDOWN",
                    "Please wait before requesting another code",
                    429,
                );
            }

            const code = OtpService.generate_otp();
            await OtpService.store_otp(email, code);

            void sendOtpEmail(email, code).catch((err) => {
                console.error("[otp-request] delivery failed", err);
            });

            return ResponseWriter.success(res, { ok: true }, "OTP sent");
        } catch (err) {
            console.error("[otp-request]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
