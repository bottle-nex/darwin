export default class EmailTemplate {
    private static readonly COLORS = {
        background: "#fafafa",
        card: "#ffffff",
        border: "#e5e5e5",
        text: "#171717",
        muted: "#737373",
        accent: "#AB9FF2",
        accentSoft: "#BCAFFF",
        field: "#1a1a1a",
        fieldHighlight: "#262626",
        fieldText: "#e5e5e5",
    } as const;

    private static readonly FONT_SANS =
        "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    private static readonly FONT_MONO =
        "'Azeret Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

    private static escape_html(value: string): string {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    private static action_button({ href, label }: { href: string; label: string }): string {
        return `
        <a href="${this.escape_html(href)}"
           style="display:inline-block;background-color:${this.COLORS.accentSoft};background-image:linear-gradient(to bottom,#CFC6FF,${this.COLORS.accentSoft});color:${this.COLORS.text};font-family:${this.FONT_MONO};font-size:13px;font-weight:600;line-height:1;text-transform:uppercase;letter-spacing:0.04em;text-decoration:none;padding:13px 22px;border-radius:10px;">
            ${this.escape_html(label)}
        </a>`;
    }

    private static layout({
        preheader,
        bodyHtml,
    }: {
        preheader: string;
        bodyHtml: string;
    }): string {
        const c = this.COLORS;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>darwin</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Azeret+Mono:wght@400;600&display=swap');
        @media (prefers-color-scheme: dark) {
            .mc-body { background-color: #0A0A0A !important; }
            .mc-card { background-color: #121212 !important; border-color: rgba(255,255,255,0.10) !important; }
            .mc-text { color: #ededed !important; }
            .mc-muted { color: #a1a1a1 !important; }
        }
    </style>
</head>
<body class="mc-body" style="margin:0;padding:0;width:100%;background-color:${c.background};font-family:${this.FONT_SANS};-webkit-font-smoothing:antialiased;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;mso-hide:all;">${this.escape_html(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.background};">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;">
                    <tr>
                        <td style="padding:0 4px 20px;">
                            <span style="font-family:${this.FONT_SANS};font-size:20px;font-weight:600;letter-spacing:-0.01em;color:${c.text};" class="mc-text">
                                darwin<span style="color:${c.accent};">.</span>
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td class="mc-card" style="background-color:${c.card};border:1px solid ${c.border};border-radius:14px;padding:32px;">
                            ${bodyHtml}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 4px 0;">
                            <p class="mc-muted" style="margin:0;font-family:${this.FONT_SANS};font-size:12px;line-height:18px;color:${c.muted};">
                                Sent by darwin. You received this email because a sign-in was requested for this address.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    static invite({
        inviter,
        target,
        url,
        message,
    }: {
        inviter: string;
        target: string;
        url: string;
        message?: string;
    }): { subject: string; html: string; text: string } {
        const c = this.COLORS;
        const subject = `You've been invited to join ${target} on trydarwin`;

        const note = message
            ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr>
                <td style="border-left:3px solid ${c.accent};padding:4px 0 4px 14px;">
                    <p class="mc-muted" style="margin:0;font-family:${this.FONT_SANS};font-size:14px;line-height:21px;font-style:italic;color:${c.muted};">
                        ${this.escape_html(message)}
                    </p>
                </td>
            </tr>
        </table>`
            : "";

        const bodyHtml = `
        <h1 class="mc-text" style="margin:0 0 8px;font-family:${this.FONT_SANS};font-size:18px;font-weight:600;color:${c.text};">
            You've been invited
        </h1>
        <p class="mc-muted" style="margin:0 0 24px;font-family:${this.FONT_SANS};font-size:14px;line-height:21px;color:${c.muted};">
            ${this.escape_html(inviter)} invited you to join <strong style="color:${c.text};">${this.escape_html(target)}</strong> on darwin.
        </p>
        ${note}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td>${this.action_button({ href: url, label: "Accept invite" })}</td>
            </tr>
        </table>
        <p class="mc-muted" style="margin:24px 0 0;font-family:${this.FONT_SANS};font-size:13px;line-height:20px;color:${c.muted};">
            If you weren't expecting this, you can safely ignore this email.
        </p>`;

        const text = `${inviter} invited you to join ${target} on darwin.${
            message ? `\n\n"${message}"` : ""
        }\n\nAccept the invitation here: ${url}\n\nIf you weren't expecting this, you can ignore this email.`;

        return {
            subject,
            html: this.layout({ preheader: `${inviter} invited you to join ${target}`, bodyHtml }),
            text,
        };
    }

    static otp({ code, expiryMinutes }: { code: string; expiryMinutes: number }): {
        subject: string;
        html: string;
        text: string;
    } {
        const c = this.COLORS;
        const safeCode = this.escape_html(code);

        const bodyHtml = `
        <h1 class="mc-text" style="margin:0 0 8px;font-family:${this.FONT_SANS};font-size:18px;font-weight:600;color:${c.text};">
            Your sign-in code
        </h1>
        <p class="mc-muted" style="margin:0 0 24px;font-family:${this.FONT_SANS};font-size:14px;line-height:21px;color:${c.muted};">
            Enter this code to finish signing in to darwin.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center" style="background-color:${c.field};border:0;border-radius:10px;box-shadow:inset 0 1px 0 0 ${c.fieldHighlight};padding:20px 12px;">
                    <span style="font-family:${this.FONT_MONO};font-size:32px;font-weight:600;letter-spacing:0.32em;color:${c.fieldText};">
                        ${safeCode}
                    </span>
                </td>
            </tr>
        </table>
        <p class="mc-muted" style="margin:14px 0 0;text-align:center;font-family:${this.FONT_SANS};font-size:12px;line-height:18px;color:${c.muted};">
            Tap and hold the code to copy it.
        </p>
        <p class="mc-muted" style="margin:24px 0 0;font-family:${this.FONT_SANS};font-size:13px;line-height:20px;color:${c.muted};">
            This code expires in ${expiryMinutes} minutes. If you didn't request it, you can safely ignore this email.
        </p>`;

        return {
            subject: "Your darwin sign-in code",
            html: this.layout({ preheader: `Your darwin sign-in code is ${code}`, bodyHtml }),
            text: `Your darwin sign-in code is ${code}.

It expires in ${expiryMinutes} minutes. If you didn't request this, you can ignore this email.`,
        };
    }

    static issueAssigned({
        actorName,
        issueTitle,
        projectName,
        url,
    }: {
        actorName: string;
        issueTitle: string;
        projectName: string;
        url: string;
    }): { subject: string; html: string; text: string } {
        const c = this.COLORS;
        const subject = `${actorName} assigned you an issue in ${projectName}`;

        const bodyHtml = `
        <h1 class="mc-text" style="margin:0 0 8px;font-family:${this.FONT_SANS};font-size:18px;font-weight:600;color:${c.text};">
            You've been assigned an issue
        </h1>
        <p class="mc-muted" style="margin:0 0 24px;font-family:${this.FONT_SANS};font-size:14px;line-height:21px;color:${c.muted};">
            ${this.escape_html(actorName)} assigned you <strong style="color:${c.text};">${this.escape_html(issueTitle)}</strong> in ${this.escape_html(projectName)}.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td>${this.action_button({ href: url, label: "View issue" })}</td>
            </tr>
        </table>`;

        const text = `${actorName} assigned you "${issueTitle}" in ${projectName}.\n\nView it here: ${url}`;

        return {
            subject,
            html: this.layout({ preheader: `${actorName} assigned you ${issueTitle}`, bodyHtml }),
            text,
        };
    }

    static mention({
        senderName,
        message,
        url,
    }: {
        senderName: string;
        message: string;
        url: string;
    }): { subject: string; html: string; text: string } {
        const c = this.COLORS;
        const subject = `${senderName} mentioned you on darwin`;

        const bodyHtml = `
        <h1 class="mc-text" style="margin:0 0 8px;font-family:${this.FONT_SANS};font-size:18px;font-weight:600;color:${c.text};">
            You were mentioned
        </h1>
        <p class="mc-muted" style="margin:0 0 24px;font-family:${this.FONT_SANS};font-size:14px;line-height:21px;color:${c.muted};">
            ${this.escape_html(senderName)} mentioned you:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr>
                <td style="border-left:3px solid ${c.accent};padding:4px 0 4px 14px;">
                    <p class="mc-muted" style="margin:0;font-family:${this.FONT_SANS};font-size:14px;line-height:21px;font-style:italic;color:${c.muted};">
                        ${this.escape_html(message)}
                    </p>
                </td>
            </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td>${this.action_button({ href: url, label: "View message" })}</td>
            </tr>
        </table>`;

        const text = `${senderName} mentioned you: "${message}"\n\nView it here: ${url}`;

        return {
            subject,
            html: this.layout({ preheader: `${senderName} mentioned you`, bodyHtml }),
            text,
        };
    }

    static removedFromScope({
        actorName,
        scopeType,
        scopeName,
    }: {
        actorName: string;
        scopeType: "team" | "organization";
        scopeName: string;
    }): { subject: string; html: string; text: string } {
        const c = this.COLORS;
        const subject = `You were removed from ${scopeName}`;

        const bodyHtml = `
        <h1 class="mc-text" style="margin:0 0 8px;font-family:${this.FONT_SANS};font-size:18px;font-weight:600;color:${c.text};">
            You no longer have access
        </h1>
        <p class="mc-muted" style="margin:0;font-family:${this.FONT_SANS};font-size:14px;line-height:21px;color:${c.muted};">
            ${this.escape_html(actorName)} removed you from the ${scopeType} <strong style="color:${c.text};">${this.escape_html(scopeName)}</strong> on darwin.
        </p>`;

        const text = `${actorName} removed you from the ${scopeType} "${scopeName}" on darwin.`;

        return {
            subject,
            html: this.layout({ preheader: `You were removed from ${scopeName}`, bodyHtml }),
            text,
        };
    }

    static issueFailed({
        issueTitle,
        projectName,
        url,
    }: {
        issueTitle: string;
        projectName: string;
        url: string;
    }): { subject: string; html: string; text: string } {
        const c = this.COLORS;
        const subject = `${issueTitle} failed in ${projectName}`;

        const bodyHtml = `
        <h1 class="mc-text" style="margin:0 0 8px;font-family:${this.FONT_SANS};font-size:18px;font-weight:600;color:${c.text};">
            An issue you're on failed
        </h1>
        <p class="mc-muted" style="margin:0 0 24px;font-family:${this.FONT_SANS};font-size:14px;line-height:21px;color:${c.muted};">
            <strong style="color:${c.text};">${this.escape_html(issueTitle)}</strong> in ${this.escape_html(projectName)} moved to Failed and needs a look.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td>${this.action_button({ href: url, label: "View issue" })}</td>
            </tr>
        </table>`;

        const text = `"${issueTitle}" in ${projectName} moved to Failed and needs a look.\n\nView it here: ${url}`;

        return {
            subject,
            html: this.layout({ preheader: `${issueTitle} failed`, bodyHtml }),
            text,
        };
    }
}
