import { Resend } from "resend";
import { ENV } from "../configs/env";

let _resend: Resend | null = null;

/**
 * Lazily construct and memoize the Resend client.
 *
 * Deferring construction until first use keeps module import side-effect free and
 * avoids instantiating the client in code paths (e.g. tests) that never send mail.
 *
 * @returns The shared {@link Resend} instance.
 */
function client(): Resend {
	if (!_resend) {
		_resend = new Resend(ENV.SERVER_RESEND_API_KEY);
	}
	return _resend;
}

/**
 * Send a sign-in OTP code to `to` via Resend.
 *
 * The message states the expiry derived from `SERVER_OTP_TTL_SECONDS`. Resend reports
 * failures in the response body rather than throwing, so this normalizes that into a
 * thrown error for callers to catch.
 *
 * @param to - Recipient email address.
 * @param code - The plaintext 6-digit code to deliver.
 * @throws If Resend returns a delivery error.
 */
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
