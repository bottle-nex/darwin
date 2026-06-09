import { Resend } from "resend";
import { ENV } from "../configs/env";
import EmailTemplate from "../templates/templates";
import chalk from "chalk";

let _resend: Resend | null = null;

/**
 * Lazily construct and memoize the Resend client.
 *
 * Deferring construction until first use keeps module import side-effect free and
 * avoids instantiating the client in code paths (e.g. tests) that never send mail.
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
 */
export async function sendOtpEmail(to: string, code: string) {
    const { subject, html, text } = EmailTemplate.otp({
        code,
        expiryMinutes: Math.floor(ENV.SERVER_OTP_TTL_SECONDS / 60),
    });

    const { error } = await client().emails.send({
        from: ENV.SERVER_EMAIL_FROM,
        to,
        subject,
        html,
        text,
    });

    if (error) {
        throw new Error(`resend send failed: ${error.message}`);
    }
}

/**
 * Context for an invite email. A team always belongs to an org, so a team invite
 * carries both names; an org invite carries only the org name. Modeling this as a
 * discriminated union lets the compiler enforce the right fields per invite type.
 */
type InviteContext =
    | { type: "org"; orgName: string }
    | { type: "team"; teamName: string; orgName: string };

/**
 * Send a team or organization invite link to `to` via Resend.
 *
 * `invite` selects the target name; `url` is the accept-invite link. `opts.inviter` is the
 * human-readable sender shown as social proof and `opts.message` is an optional note from the
 * inviter. Like {@link sendOtpEmail}, Resend reports failures in the response body, so this
 * normalizes them into a thrown error for callers to catch.
 */
export async function inviteMember(
    to: string,
    url: string,
    invite: InviteContext,
    opts?: { inviter?: string; message?: string },
): Promise<boolean> {
    const target = invite.type === "team" ? invite.teamName : invite.orgName;
    const inviter = opts?.inviter?.trim() || "Someone";

    const { subject, html, text } = EmailTemplate.invite({
        inviter,
        target,
        url,
        message: opts?.message,
    });

    const { error } = await client().emails.send({
        from: ENV.SERVER_EMAIL_FROM,
        to,
        subject,
        html,
        text,
    });

    if (error) {
        console.error(chalk.red("resend send failed: "), error?.message);
        return false;
    }
    return true;
}
