import { Resend } from "resend";
import { ENV } from "../configs/env";

let _resend: Resend | null = null;
function client(): Resend {
    if (!_resend) {
        _resend = new Resend(ENV.SERVER_RESEND_API_KEY);
    }
    return _resend;
}

export async function sendOtpEmail(to: string, code: string) {
    const { error } = await client().emails.send({
        from: "trymatcha <noreply@trymatcha.app>",
        to,
        subject: "Your trymatcha sign-in code",
        text: `Your trymatcha signin code is ${code}.\n\nIt expires in ${Math.floor(
            ENV.SERVER_OTP_TTL_SECONDS / 60,
        )} minutes. If you didn't request this, you can ignore this email.`,
    });

    if (error) {
        throw new Error(`resend send failed: ${error.message}`);
    }
}
