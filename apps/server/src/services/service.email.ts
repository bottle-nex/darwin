import { Resend } from "resend";
import { ENV } from "../configs/env";
import EmailTemplate from "../templates/templates";
import chalk from "chalk";

let _resend: Resend | null = null;

function client(): Resend {
    if (!_resend) {
        _resend = new Resend(ENV.SERVER_RESEND_API_KEY);
    }
    return _resend;
}

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

type InviteContext =
    { type: "org"; orgName: string } | { type: "team"; teamName: string; orgName: string };

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

export async function sendIssueAssignedEmail(
    to: string,
    data: { actorName: string; issueTitle: string; projectName: string; url: string },
): Promise<boolean> {
    const { subject, html, text } = EmailTemplate.issueAssigned(data);

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

export async function sendMentionEmail(
    to: string,
    data: { senderName: string; message: string; url: string },
): Promise<boolean> {
    const { subject, html, text } = EmailTemplate.mention(data);

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

export async function sendRemovedFromScopeEmail(
    to: string,
    data: { actorName: string; scopeType: "team" | "organization"; scopeName: string },
): Promise<boolean> {
    const { subject, html, text } = EmailTemplate.removedFromScope(data);

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

export async function sendIssueFailedEmail(
    to: string,
    data: { issueTitle: string; projectName: string; url: string },
): Promise<boolean> {
    const { subject, html, text } = EmailTemplate.issueFailed(data);

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
