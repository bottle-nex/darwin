import type { Request, Response } from "express";
import { z } from "zod";
import ResponseWriter from "../../services/service.response";
import OtpService from "../../services/service.otp";
import AdminService from "../../services/service.admin";
import { sendOtpEmail } from "../../services/service.email";

const body_schema = z.object({
    email: z.email(),
});

export default class AdminOtpRequestController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "Valid email required");
        }
        const email = parsed.data.email.toLowerCase();

        try {
            if (await OtpService.is_cooldown(email, AdminService.OTP_NAMESPACE)) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "OTP_COOLDOWN",
                    "Please wait before requesting another code",
                    429,
                );
            }

            if (!AdminService.is_allowed(email)) {
                return ResponseWriter.success(res, { ok: true }, "OTP sent");
            }

            const code = OtpService.generate_otp();
            await OtpService.store_otp(email, code, AdminService.OTP_NAMESPACE);

            void sendOtpEmail(email, code).catch((err) => {
                console.error("[admin-otp-request] delivery failed", err);
            });

            return ResponseWriter.success(res, { ok: true }, "OTP sent");
        } catch (err) {
            console.error("[admin-otp-request]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
