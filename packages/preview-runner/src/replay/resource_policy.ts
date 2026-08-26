export type ReplayResourceDecision = "capture" | "block" | "unsupported";

export interface ReplayResourcePolicy {
    applicationOrigin: string;
    staticOrigins: string[];
    sameOriginJsonPaths: string[];
    allowedQueryParameters: Record<string, string[]>;
    maxResponseBytes: number;
}

export interface ReplayResourceRequest {
    url: string;
    method: string;
    resourceType: string;
    headers: Record<string, string | undefined>;
    credentials: "omit" | "include" | "same-origin";
    responseHeaders: Record<string, string | undefined>;
    responseBytes: number;
}

const SENSITIVE_REQUEST_HEADERS = new Set(["authorization", "cookie", "proxy-authorization"]);
const SENSITIVE_QUERY_NAMES = [
    "apikey",
    "authorization",
    "credential",
    "key",
    "password",
    "secret",
    "session",
    "signature",
    "token",
];
const LIVE_RESOURCE_TYPES = new Set(["eventsource", "websocket"]);
const STATIC_RESOURCE_TYPES = new Set([
    "font",
    "image",
    "manifest",
    "media",
    "other",
    "script",
    "stylesheet",
    "wasm",
]);
const JSON_RESOURCE_TYPES = new Set([
    ...STATIC_RESOURCE_TYPES,
    "fetch",
    "preload",
    "prefetch",
    "xhr",
]);
const SAFE_RESPONSE_HEADERS = new Set(["cache-control", "content-type", "etag", "last-modified"]);

function header_value(
    headers: Record<string, string | undefined>,
    name: string,
): string | undefined {
    return Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];
}

function normalized_origin(url: string): string | null {
    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
}

function is_sensitive_query_parameter(name: string): boolean {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return SENSITIVE_QUERY_NAMES.some((sensitiveName) => normalized.includes(sensitiveName));
}

function is_sensitive_request_header(name: string): boolean {
    const normalized = name.toLowerCase();
    return (
        SENSITIVE_REQUEST_HEADERS.has(normalized) ||
        /(?:api[-_]?key|authorization|cookie|credential|password|secret|session|token)/.test(
            normalized,
        )
    );
}

export function normalizeReplayRequestUrl(
    value: string,
    allowedQueryParameters: Record<string, string[]>,
): string {
    const url = new URL(value);
    if (url.username || url.password) {
        throw new Error("replay request URL contains an unapproved identity value");
    }

    const allowedValues = new Map(
        Object.entries(allowedQueryParameters).map(([name, values]) => [
            name.toLowerCase(),
            new Set(values),
        ]),
    );
    for (const [name, queryValue] of url.searchParams) {
        if (
            is_sensitive_query_parameter(name) ||
            !allowedValues.get(name.toLowerCase())?.has(queryValue)
        ) {
            throw new Error("replay request URL contains an unapproved identity value");
        }
    }

    url.hash = "";
    url.searchParams.sort();
    return url.toString();
}

function is_json_response(request: ReplayResourceRequest): boolean {
    const contentType = header_value(request.responseHeaders, "content-type") ?? "";
    const mimeType = contentType.toLowerCase().split(";", 1)[0]?.trim() ?? "";
    return (
        mimeType === "application/json" || mimeType === "text/json" || mimeType.endsWith("+json")
    );
}

function path_matches_policy(pathname: string, allowedPaths: string[]): boolean {
    return allowedPaths.some((allowedPath) =>
        allowedPath.endsWith("/*")
            ? pathname.startsWith(allowedPath.slice(0, -1))
            : pathname === allowedPath,
    );
}

export function classifyReplayRequest(
    request: ReplayResourceRequest,
    policy: ReplayResourcePolicy,
): { decision: ReplayResourceDecision } {
    const method = request.method.toUpperCase();
    let normalizedUrl: string;
    try {
        normalizedUrl = normalizeReplayRequestUrl(request.url, policy.allowedQueryParameters);
    } catch {
        return { decision: "block" };
    }
    const origin = normalized_origin(normalizedUrl);
    const applicationOrigin = normalized_origin(policy.applicationOrigin);

    if (!origin || !applicationOrigin) return { decision: "block" };
    if (method !== "GET" && method !== "HEAD") return { decision: "unsupported" };
    if (
        LIVE_RESOURCE_TYPES.has(request.resourceType.toLowerCase()) ||
        /^wss?:$/i.test(new URL(normalizedUrl).protocol)
    ) {
        return { decision: "unsupported" };
    }
    if (request.credentials !== "omit") return { decision: "block" };
    if (
        Object.keys(request.headers).some(is_sensitive_request_header) ||
        header_value(request.responseHeaders, "set-cookie") !== undefined ||
        request.responseBytes > policy.maxResponseBytes
    ) {
        return { decision: "block" };
    }
    const resourceType = request.resourceType.toLowerCase();
    if (is_json_response(request)) {
        return {
            decision:
                JSON_RESOURCE_TYPES.has(resourceType) &&
                origin === applicationOrigin &&
                path_matches_policy(new URL(normalizedUrl).pathname, policy.sameOriginJsonPaths)
                    ? "capture"
                    : "block",
        };
    }
    if (STATIC_RESOURCE_TYPES.has(resourceType)) {
        if (origin === applicationOrigin) return { decision: "capture" };
        if (policy.staticOrigins.includes(origin)) {
            return { decision: "capture" };
        }
        return { decision: "block" };
    }
    return { decision: "block" };
}

export function redactReplayResponseHeaders(
    headers: Record<string, string | undefined>,
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(headers).flatMap(([name, value]) => {
            const normalizedName = name.toLowerCase();
            return SAFE_RESPONSE_HEADERS.has(normalizedName) && value !== undefined
                ? [[normalizedName, value]]
                : [];
        }),
    );
}
