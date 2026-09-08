export function issueHref(issueId: string): string {
    const base = window.location.pathname.replace(/\/issue\/[^/]+\/?$/, "");
    return `${window.location.origin}${base}/issue/${issueId}`;
}
