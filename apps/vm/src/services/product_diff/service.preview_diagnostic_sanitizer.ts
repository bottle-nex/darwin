const MAX_DIAGNOSTIC_LENGTH = 500;
const HTML_RESPONSE = /<!doctype|<html\b|<body\b|<script\b|<input\b/i;
const CREDENTIAL_QUERY =
    /([?&](?:access[_-]?token|id[_-]?token|token|api[_-]?key|apikey|key|secret|password|passwd|authorization)=)[^&#\s"'<>]*/gi;
const BEARER_CREDENTIAL = /\bBearer\s+[^\s,;]+/gi;
const LABELLED_CREDENTIAL =
    /(?<![?&])\b((?:x-?api-?key|api[-_ ]?key|access[-_ ]?token|id[-_ ]?token|token|secret|password|passwd|authorization))(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\r\n<]+)/gi;

export function sanitize_preview_diagnostic_message(message: string): string {
    const htmlStart = message.search(HTML_RESPONSE);
    const withoutHtml =
        htmlStart >= 0 ? `${message.slice(0, htmlStart).trim()} [HTML response omitted]` : message;
    return withoutHtml
        .replace(CREDENTIAL_QUERY, "$1[redacted]")
        .replace(BEARER_CREDENTIAL, "Bearer [redacted]")
        .replace(LABELLED_CREDENTIAL, "$1$2[redacted]")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_DIAGNOSTIC_LENGTH);
}
