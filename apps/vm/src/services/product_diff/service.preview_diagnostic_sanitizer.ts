const MAX_DIAGNOSTIC_LENGTH = 500;
const HTML_RESPONSE = /<!doctype|<\s*\/?\s*[a-z][^>]*>/i;
const SENSITIVE_LABEL =
    "(?:[a-z0-9_.-]*(?:token|secret|password|passwd|credential|cookie|session|api[-_]?key|apikey|authorization)[a-z0-9_.-]*|x-?api-?key|api[-_ ]?key)";
const CREDENTIAL_QUERY = new RegExp(`([?&]${SENSITIVE_LABEL}=)[^&#\\s"'<>]*`, "gi");
const BEARER_CREDENTIAL = /\bBearer\s+[^\s,;]+/gi;
const LABELLED_CREDENTIAL = new RegExp(
    `(?<![?&a-z0-9_.-])(${SENSITIVE_LABEL})(\\s*[:=]\\s*)(?:"[^"]*"|'[^']*'|[^\\r\\n<]*?)(?=(?:\\s+${SENSITIVE_LABEL}\\s*[:=])|\\s+\\[HTML response omitted\\]|$)`,
    "gi",
);

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
