/**
 * Static builders for transactional email markup.
 *
 * The server runs on Bun with no React/JSX, so emails are assembled as raw HTML strings with
 * inline CSS. Layout is table-based and styles are inlined for maximum client compatibility
 * (Outlook strips <style>, gradients, and box-shadow; Gmail blocks web fonts). Web fonts,
 * gradients, and dark mode are layered on as progressive enhancement over a solid, web-safe
 * baseline.
 *
 * Each public builder returns a ready-to-send `{ subject, html, text }` triple — the HTML body
 * and a matching plaintext fallback for clients that don't render HTML.
 */
export default class EmailTemplate {
    /** Brand palette, mirrored from the web app's design tokens (apps/web/app/globals.css). */
    private static readonly COLORS = {
        background: "#fafafa",
        card: "#ffffff",
        border: "#e5e5e5",
        text: "#171717",
        muted: "#737373",
        accent: "#AB9FF2",
        accentSoft: "#BCAFFF",
        // Dark "field" treatment, mirrored from the web app's Input (apps/web/components/ui/input.tsx):
        // a dark surface with a 1px inset top highlight rather than a flat border.
        field: "#1a1a1a",
        fieldHighlight: "#262626",
        fieldText: "#e5e5e5",
    } as const;

    private static readonly FONT_SANS =
        "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    private static readonly FONT_MONO =
        "'Azeret Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

    /**
     * Escape text destined for an HTML context. All caller-supplied strings (codes, names, urls)
     * must pass through this before interpolation to avoid breaking the markup or injecting tags.
     */
    private static escape_html(value: string): string {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * Render an action link styled like the web app's default Button (button.tsx): a solid
     * `accentSoft` background as the web-safe fallback with a gradient layered on, dark text,
     * 10px radius, uppercase mono label. Reusable by future emails (e.g. invites).
     */
    private static action_button({ href, label }: { href: string; label: string }): string {
        return `
        <a href="${this.escape_html(href)}"
           style="display:inline-block;background-color:${this.COLORS.accentSoft};background-image:linear-gradient(to bottom,#CFC6FF,${this.COLORS.accentSoft});color:${this.COLORS.text};font-family:${this.FONT_MONO};font-size:13px;font-weight:600;line-height:1;text-transform:uppercase;letter-spacing:0.04em;text-decoration:none;padding:13px 22px;border-radius:10px;">
            ${this.escape_html(label)}
        </a>`;
    }

    /**
     * Wrap inner body HTML in the full branded email document.
     *
     * `preheader` is the hidden inbox preview text; `bodyHtml` is trusted, pre-escaped markup
     * produced by a specific builder.
     */
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
    <title>matcha</title>
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
                                matcha<span style="color:${c.accent};">.</span>
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
                                Sent by matcha. You received this email because a sign-in was requested for this address.
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

    /**
     * Build the branded invite email.
     *
     * `inviter` is the human-readable sender (name or email) shown as social proof; `target`
     * is the org/team the recipient is being invited into; `url` is the accept-invite link.
     * An optional `message` from the inviter is rendered as a quoted note when present.
     */
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
        const subject = `You've been invited to join ${target} on trymatcha`;

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
            ${this.escape_html(inviter)} invited you to join <strong style="color:${c.text};">${this.escape_html(target)}</strong> on matcha.
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

        const text = `${inviter} invited you to join ${target} on matcha.${
            message ? `\n\n"${message}"` : ""
        }\n\nAccept the invitation here: ${url}\n\nIf you weren't expecting this, you can ignore this email.`;

        return {
            subject,
            html: this.layout({ preheader: `${inviter} invited you to join ${target}`, bodyHtml }),
            text,
        };
    }

    /**
     * Build the branded sign-in OTP email.
     *
     * The flow is code-entry only — the recipient types the code back into the app — so the email
     * centers on a large, copyable code chip styled like the web app's dark Input, rather than an
     * action link (email clients block JavaScript, so a copy button can't function).
     */
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
            Enter this code to finish signing in to matcha.
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
            subject: "Your matcha sign-in code",
            html: this.layout({ preheader: `Your matcha sign-in code is ${code}`, bodyHtml }),
            text: `Your matcha sign-in code is ${code}.

It expires in ${expiryMinutes} minutes. If you didn't request this, you can ignore this email.`,
        };
    }

    /**
     * Build the branded "issue assigned" notification email.
     *
     * `actorName` is whoever performed the assignment; `issueTitle`/`projectName` identify what
     * changed; `url` deep-links to the issue.
     */
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

    /**
     * Build the branded "mentioned in chat" notification email, shared by issue chat and
     * project chat mentions since both are just a message someone tagged you in.
     *
     * `message` is the chat text the recipient was tagged in; `url` deep-links to the thread.
     */
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
        const subject = `${senderName} mentioned you on matcha`;

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
}
