import type { Request, Response } from "express";
import { z } from "zod";

import AdminService from "../../services/service.admin";
import { signAdminJwt } from "../../services/service.jwt";
import OtpService from "../../services/service.otp";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    email: z.email(),
    code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export default class AdminOtpVerifyController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "Email and 6-digit code required");
        }
        const email = parsed.data.email.toLowerCase();
        const { code } = parsed.data;

        try {
            if (!AdminService.is_allowed(email)) {
                return ResponseWriter.custom(res, false, "OTP_INVALID", "Invalid code", 400);
            }

            const result = await OtpService.verify_otp(email, code, AdminService.OTP_NAMESPACE);
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

            const token = signAdminJwt(email);
            return ResponseWriter.success(res, { admin: { email }, token }, "OTP verified");
        } catch (err) {
            console.error("[admin-otp-verify]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
