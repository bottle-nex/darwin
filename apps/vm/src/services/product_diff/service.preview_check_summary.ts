const SAFE_IDENTIFIER = /^[a-z0-9][a-z0-9-]{0,48}$/;
const SAFE_ROUTE_PATH = /^\/[a-z0-9][a-z0-9-]{0,48}$/;
const CHECK_PROBLEMS = new Set([
    "HttpError",
    "Redirected",
    "MissingRoot",
    "EmptyRoot",
    "PageError",
    "ConsoleError",
    "NextErrorOverlay",
    "Timeout",
]);

export interface PreviewCheckFailure {
    targetId: string;
    stateId: string;
    httpStatus: number | null;
    problem: string | null;
}

function safe_identifier(value: string): string {
    return SAFE_IDENTIFIER.test(value) ? value : "unknown";
}

function safe_problem(value: string | null): string {
    return value && CHECK_PROBLEMS.has(value) ? value : "Unknown";
}

function safe_http_status(value: number | null): string | null {
    return value !== null && Number.isInteger(value) && value >= 100 && value <= 599
        ? String(value)
        : null;
}

function safe_route_path(value: string): string {
    return SAFE_ROUTE_PATH.test(value) ? value : "/unknown";
}

export function preview_check_summary(
    revision: "head" | "base",
    failed: PreviewCheckFailure | undefined,
    routePath: string,
): string {
    const target = failed ? safe_identifier(failed.targetId) : "unknown";
    const state = failed ? safe_identifier(failed.stateId) : "unknown";
    const problem = safe_problem(failed?.problem ?? null);
    const httpStatus = safe_http_status(failed?.httpStatus ?? null);
    const fields = [
        "preview browser validation failed",
        `revision=${revision}`,
        `target=${target}`,
        `state=${state}`,
        `problem=${problem}`,
    ];
    if (httpStatus) fields.push(`httpStatus=${httpStatus}`);
    fields.push(`route=${safe_route_path(routePath)}`);
    return fields.join("; ");
}
