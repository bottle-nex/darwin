import { Resend } from "resend";
import { ENV } from "../configs/env";

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
    const { error } = await client().emails.send({
        from: "trymatcha <onboarding@resend.dev>",
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
 * `invite` selects the wording and names; `url` is the accept-invite link. Like
 * {@link sendOtpEmail}, Resend reports failures in the response body, so this
 * normalizes them into a thrown error for callers to catch.
 */
export async function inviteMember(to: string, url: string, invite: InviteContext) {
    const subject =
        invite.type === "team"
            ? `You've been invited to join ${invite.teamName} on trymatcha`
            : `You've been invited to join ${invite.orgName} on trymatcha`;

    const body =
        invite.type === "team"
            ? `You've been invited to join the team "${invite.teamName}" in ${invite.orgName} on trymatcha.`
            : `You've been invited to join the organization "${invite.orgName}" on trymatcha.`;

    const { error } = await client().emails.send({
        from: "trymatcha <onboarding@resend.dev>",
        to,
        subject,
        text: `${body}\n\nAccept the invitation here: ${url}\n\nIf you weren't expecting this, you can ignore this email.`,
    });

    if (error) {
        throw new Error(`resend send failed: ${error.message}`);
    }
}
