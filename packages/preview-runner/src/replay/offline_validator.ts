import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Page } from "playwright";
import { z } from "zod";

import type {
    ReplayAccessibilitySummary,
    ReplayDomSummary,
    ReplayScenarioEvidence,
} from "../../../types/product-diff/product-diff.contract";

import { open_browser, open_replay_context } from "../browser";
import { replayScenarioSchema, type ReplayScenario } from "../contract";
import { runReplayScenario, type ReplayActionOutcome } from "./resource_recorder";

interface StoredReplayResource {
    request: {
        url: string;
        method: "GET" | "HEAD";
        resourceType: string;
        responseContentType: string | null;
        variantHeaders: Record<string, string>;
    };
    responseHeaders: Record<string, string>;
    objectKey: string;
    sha256: string;
    responseStatus: number;
    responseStatusText: string;
    redirectLocation: string | null;
}

const storedReplayResourceSchema = z
    .object({
        request: z
            .object({
                url: z.string().url(),
                method: z.enum(["GET", "HEAD"]),
                resourceType: z.string().min(1).max(100),
                responseContentType: z.string().max(300).nullable(),
                variantHeaders: z
                    .record(z.string(), z.string())
                    .refine((headers) =>
                        Object.keys(headers).every(
                            (name) => name === "accept" || name === "accept-language",
                        ),
                    ),
            })
            .strict(),
        responseHeaders: z.record(z.string(), z.string()),
        objectKey: z.string().regex(/^(assets|responses)\/[a-f0-9]{64}$/),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        responseStatus: z.number().int().min(100).max(599).default(200),
        responseStatusText: z.string().max(120).default(""),
        redirectLocation: z.string().url().nullable().default(null),
    })
    .strict()
    .refine(
        (resource) => resource.objectKey.endsWith(resource.sha256),
        "object key must match hash",
    );

const storedReplayArtifactSchema = z.object({ resources: z.array(storedReplayResourceSchema) });

interface StoredReplayArtifact {
    resources: StoredReplayResource[];
}

const ANIMATION_DISCOVERY_TIMEOUT_MS = 500;
const CUSTOMER_IDENTIFIER_KEYS = new Set([
    "accountid",
    "address",
    "customeremail",
    "customerid",
    "displayname",
    "email",
    "emailaddress",
    "firstname",
    "fullname",
    "id",
    "ip",
    "ipaddress",
    "issueid",
    "lastname",
    "memberid",
    "mobile",
    "mobilenumber",
    "organizationid",
    "orgid",
    "phone",
    "phonenumber",
    "postalcode",
    "projectid",
    "streetaddress",
    "teamid",
    "tenantid",
    "useremail",
    "userid",
    "username",
    "workspaceid",
]);
const CUSTOMER_IDENTIFIER_PREFIXES = [
    "account",
    "customer",
    "issue",
    "member",
    "organization",
    "org",
    "project",
    "team",
    "tenant",
    "user",
    "workspace",
];
const CUSTOMER_IDENTIFIER_SUFFIXES = ["guid", "id", "identifier", "uuid"];
const EMAIL_VALUE_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const EMAIL_PATH_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_VALUE_PATTERN = /(^|[^A-Za-z0-9])\+?\d[\d ()-]{6,}\d(?=$|[^A-Za-z0-9])/g;
const UUID_VALUE_PATTERN =
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const UUID_PATH_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JWT_VALUE_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const KEYED_VALUE_PATTERN =
    /(["']?)([A-Za-z][A-Za-z0-9_.-]{0,79})\1(\s*[:=]\s*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}\]]+)/g;

export interface ReplayValidationResult {
    fidelity: "Verified" | "Partial" | "Unavailable";
    unexpectedRequests: string[];
    diagnostics: string[];
    animationPresent: boolean;
    actions: ReplayActionOutcome[];
    pageErrors: string[];
    consoleErrors: string[];
    failedRequests: string[];
    scenarios: ReplayScenarioEvidence[];
    dom: ReplayDomSummary | null;
    accessibility: ReplayAccessibilitySummary | null;
}

function redacted_url(value: string): string {
    try {
        const url = new URL(value);
        const pathname = url.pathname
            .split("/")
            .map((segment) => (sensitive_path_segment(segment) ? "[redacted]" : segment))
            .join("/");
        return `${url.origin}${pathname}`;
    } catch {
        return "unparseable request";
    }
}

function normalized_diagnostic_key(value: string): string {
    return value.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

function sensitive_diagnostic_key(value: string): boolean {
    const normalized = normalized_diagnostic_key(value);
    if (CUSTOMER_IDENTIFIER_KEYS.has(normalized)) return true;
    if (
        CUSTOMER_IDENTIFIER_SUFFIXES.some((suffix) => normalized.endsWith(suffix)) &&
        CUSTOMER_IDENTIFIER_PREFIXES.some((prefix) => normalized.startsWith(prefix))
    ) {
        return true;
    }
    return (
        normalized.includes("authorization") ||
        normalized.includes("cookie") ||
        normalized.includes("credential") ||
        normalized.includes("csrf") ||
        normalized.includes("password") ||
        normalized.includes("passwd") ||
        normalized.includes("privatekey") ||
        normalized.includes("secret") ||
        normalized.includes("session") ||
        normalized.includes("token") ||
        normalized.includes("apikey") ||
        normalized.includes("accesskey") ||
        normalized === "jwt" ||
        normalized === "pwd"
    );
}

function sensitive_path_segment(value: string): boolean {
    let decoded = value;
    try {
        decoded = decodeURIComponent(value);
    } catch {
        return true;
    }
    return (
        EMAIL_PATH_PATTERN.test(decoded) ||
        UUID_PATH_PATTERN.test(decoded) ||
        /^\d{3,}$/.test(decoded) ||
        /^[A-Za-z0-9_-]{16,}$/.test(decoded)
    );
}

function redacted_keyed_values(value: string): string {
    return value.replace(
        KEYED_VALUE_PATTERN,
        (match, quote: string, key: string, separator: string, diagnosticValue: string) => {
            if (!sensitive_diagnostic_key(key)) return match;
            const valueQuote = diagnosticValue.startsWith("'")
                ? "'"
                : diagnosticValue.startsWith('"')
                  ? '"'
                  : "";
            return `${quote}${key}${quote}${separator}${valueQuote}[redacted]${valueQuote}`;
        },
    );
}

function redacted_freeform_values(value: string): string {
    return value
        .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
        .replace(/https?:\/\/[^\s"')]+/gi, (candidate) => redacted_url(candidate))
        .replace(EMAIL_VALUE_PATTERN, "[redacted]")
        .replace(PHONE_VALUE_PATTERN, "$1[redacted]")
        .replace(UUID_VALUE_PATTERN, "[redacted]")
        .replace(JWT_VALUE_PATTERN, "[redacted]");
}

function redacted_structured_value(value: unknown, key: string | null, depth: number): unknown {
    if (key && sensitive_diagnostic_key(key)) return "[redacted]";
    if (depth >= 12) return "[redacted]";
    if (typeof value === "string") return redacted_freeform_values(value);
    if (Array.isArray(value)) {
        return value.map((entry) => redacted_structured_value(entry, null, depth + 1));
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([entryKey, entryValue]) => [
                entryKey,
                redacted_structured_value(entryValue, entryKey, depth + 1),
            ]),
        );
    }
    return value;
}

function redacted_structured_diagnostic(value: string): string | null {
    try {
        const parsed = JSON.parse(value) as unknown;
        return JSON.stringify(redacted_structured_value(parsed, null, 0));
    } catch {
        return null;
    }
}

function safe_browser_diagnostic(value: string): string {
    const boundedInput = value.slice(0, 10_000);
    const structured = redacted_structured_diagnostic(boundedInput);
    if (structured !== null) return structured.slice(0, 300);
    const freeformValuesRedacted = redacted_freeform_values(boundedInput);
    return redacted_freeform_values(redacted_keyed_values(freeformValuesRedacted)).slice(0, 300);
}

function append_bounded(values: string[], value: string): void {
    if (values.length < 20) values.push(safe_browser_diagnostic(value));
}

function safe_object_path(root: string, objectKey: string): string | null {
    const rootPath = resolve(root);
    const absolute = resolve(rootPath, objectKey);
    if (!absolute.startsWith(`${rootPath}/`)) return null;
    try {
        const resolvedRoot = realpathSync(rootPath);
        const stat = lstatSync(absolute);
        if (stat.isSymbolicLink()) return null;
        const resolvedObject = realpathSync(absolute);
        return resolvedObject.startsWith(`${resolvedRoot}/`) ? resolvedObject : null;
    } catch {
        return null;
    }
}

function read_artifact(root: string): StoredReplayArtifact {
    return storedReplayArtifactSchema.parse(
        JSON.parse(readFileSync(join(root, "artifact.json"), "utf8")),
    );
}

function document_resource(resources: StoredReplayResource[]): StoredReplayResource | null {
    return resources.find((resource) => resource.request.resourceType === "document") ?? null;
}

function resource_body(root: string, resource: StoredReplayResource): Buffer | null {
    const path = safe_object_path(root, resource.objectKey);
    if (!path) return null;
    try {
        const body = readFileSync(path);
        return createHash("sha256").update(body).digest("hex") === resource.sha256 ? body : null;
    } catch {
        return null;
    }
}

function resource_headers(resource: StoredReplayResource): Record<string, string> {
    return {
        ...resource.responseHeaders,
        ...(resource.redirectLocation ? { location: resource.redirectLocation } : {}),
    };
}

function write_resource(
    root: string,
    request: IncomingMessage,
    response: ServerResponse,
    resource: StoredReplayResource,
    integrityFailures: string[],
): void {
    const body = resource_body(root, resource);
    if (!body) {
        integrityFailures.push("recorded resource integrity check failed");
        response.writeHead(500).end();
        return;
    }
    response.writeHead(resource.responseStatus, resource_headers(resource));
    response.end(request.method === "HEAD" ? undefined : body);
}

function matching_resource(
    resources: StoredReplayResource[],
    url: string,
    method: string,
    headers: Record<string, string>,
): StoredReplayResource | null {
    return (
        resources.find(
            (resource) =>
                resource.request.url === url &&
                resource.request.method === method.toUpperCase() &&
                Object.entries(resource.request.variantHeaders).every(
                    ([name, value]) => headers[name.toLowerCase()] === value,
                ),
        ) ?? null
    );
}

function create_artifact_server(
    root: string,
    documentOrigin: string,
    resources: StoredReplayResource[],
    integrityFailures: string[],
): Server {
    return createServer((request, response) => {
        const url = new URL(request.url ?? "/", documentOrigin);
        const headers = Object.fromEntries(
            Object.entries(request.headers).flatMap(([name, value]) =>
                typeof value === "string" ? [[name, value]] : [],
            ),
        );
        const expected = matching_resource(
            resources,
            `${documentOrigin}${url.pathname}${url.search}`,
            request.method ?? "GET",
            headers,
        );
        if (!expected) {
            response.writeHead(404).end();
            return;
        }
        write_resource(root, request, response, expected, integrityFailures);
    });
}

function listen(server: Server): Promise<number> {
    return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            server.off("error", reject);
            const address = server.address();
            if (!address || typeof address === "string") {
                reject(new Error("artifact server did not bind a TCP port"));
                return;
            }
            resolve(address.port);
        });
    });
}

function close(server: Server): Promise<void> {
    return new Promise((resolve) => server.close(() => resolve()));
}

async function animation_present(page: Page): Promise<boolean> {
    return page
        .waitForFunction(() => document.getAnimations().length > 0, undefined, {
            timeout: ANIMATION_DISCOVERY_TIMEOUT_MS,
        })
        .then(() => true)
        .catch(() => false);
}

async function replay_page_summaries(page: Page): Promise<{
    dom: ReplayDomSummary;
    accessibility: ReplayAccessibilitySummary;
}> {
    return page.evaluate(() => {
        const interactiveSelector =
            'a[href],button,input,select,textarea,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])';
        const controlSelector = "button,input,select,textarea,a[href]";
        const controls = [...document.querySelectorAll<HTMLElement>(controlSelector)];
        const labeledControlCount = controls.filter((element) => {
            if (element.getAttribute("aria-label")?.trim()) return true;
            if (element.getAttribute("aria-labelledby")?.trim()) return true;
            if (element instanceof HTMLInputElement && element.labels?.length) return true;
            if (element instanceof HTMLSelectElement && element.labels?.length) return true;
            if (element instanceof HTMLTextAreaElement && element.labels?.length) return true;
            return Boolean(element.textContent?.trim() || element.getAttribute("title")?.trim());
        }).length;
        return {
            dom: {
                elementCount: Math.min(document.querySelectorAll("*").length, 1_000_000),
                interactiveElementCount: Math.min(
                    document.querySelectorAll(interactiveSelector).length,
                    1_000_000,
                ),
                visibleTextLength: Math.min((document.body?.innerText ?? "").length, 10_000_000),
            },
            accessibility: {
                landmarkCount: Math.min(
                    document.querySelectorAll(
                        'main,nav,aside,header,footer,[role="main"],[role="navigation"],[role="complementary"],[role="banner"],[role="contentinfo"]',
                    ).length,
                    1_000_000,
                ),
                headingCount: Math.min(
                    document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]').length,
                    1_000_000,
                ),
                labeledControlCount: Math.min(labeledControlCount, 1_000_000),
                unlabeledControlCount: Math.min(controls.length - labeledControlCount, 1_000_000),
            },
        };
    });
}

export async function validateReplayArtifact(
    artifactRoot: string,
    inputScenario: ReplayScenario | ReplayScenario[],
): Promise<ReplayValidationResult> {
    const scenarios = z
        .array(replayScenarioSchema)
        .min(1)
        .max(12)
        .parse(Array.isArray(inputScenario) ? inputScenario : [inputScenario]);
    const empty = {
        unexpectedRequests: [] as string[],
        diagnostics: [] as string[],
        animationPresent: false,
        actions: [] as ReplayActionOutcome[],
        pageErrors: [] as string[],
        consoleErrors: [] as string[],
        failedRequests: [] as string[],
        scenarios: [] as ReplayScenarioEvidence[],
        dom: null as ReplayDomSummary | null,
        accessibility: null as ReplayAccessibilitySummary | null,
    };
    let server: Server | null = null;
    let browser: Awaited<ReturnType<typeof open_browser>> | null = null;
    let context: Awaited<ReturnType<typeof open_replay_context>> | null = null;
    let page: Awaited<
        ReturnType<Awaited<ReturnType<typeof open_replay_context>>["newPage"]>
    > | null = null;

    try {
        const artifact = read_artifact(artifactRoot);
        const recordedDocument = document_resource(artifact.resources);
        if (!recordedDocument) {
            return {
                fidelity: "Unavailable",
                ...empty,
                diagnostics: ["recorded document is unavailable"],
            };
        }
        const documentUrl = new URL(recordedDocument.request.url);
        const documentOrigin = documentUrl.origin;
        const integrityFailures: string[] = [];
        server = create_artifact_server(
            artifactRoot,
            documentOrigin,
            artifact.resources,
            integrityFailures,
        );
        const port = await listen(server);
        const loopbackOrigin = `http://127.0.0.1:${port}`;

        browser = await open_browser();
        context = await open_replay_context(browser, { serviceWorkers: "block" });
        await context.route("**", async (route) => {
            const request = route.request();
            const url = new URL(request.url());
            if (url.protocol === "data:" || url.protocol === "blob:") return route.continue();
            const headers = await request.allHeaders();
            const requestedUrl =
                url.origin === loopbackOrigin
                    ? `${documentOrigin}${url.pathname}${url.search}`
                    : request.url();
            const resource = matching_resource(
                artifact.resources,
                requestedUrl,
                request.method(),
                headers,
            );
            if (!resource) {
                empty.unexpectedRequests.push(redacted_url(request.url()));
                return route.abort();
            }
            if (url.origin === loopbackOrigin) return route.continue();
            const body = resource_body(artifactRoot, resource);
            if (!body) {
                integrityFailures.push("recorded resource integrity check failed");
                return route.abort();
            }
            return route.fulfill({
                status: resource.responseStatus,
                headers: resource_headers(resource),
                body,
            });
        });
        await context.routeWebSocket("**", (webSocket) => {
            empty.unexpectedRequests.push(redacted_url(webSocket.url()));
            webSocket.close();
        });
        page = await context.newPage();
        page.on("pageerror", (error) => append_bounded(empty.pageErrors, error.message));
        page.on("console", (message) => {
            if (message.type() === "error") append_bounded(empty.consoleErrors, message.text());
        });
        page.on("requestfailed", (request) => {
            if (empty.failedRequests.length < 20) {
                empty.failedRequests.push(redacted_url(request.url()).slice(0, 300));
            }
        });
        const response = await page.goto(
            `${loopbackOrigin}${documentUrl.pathname}${documentUrl.search}`,
            {
                waitUntil: "networkidle",
                timeout: 10_000,
            },
        );
        if (!response || response.status() >= 400) {
            return {
                fidelity: "Unavailable",
                ...empty,
                diagnostics: ["offline document could not load"],
            };
        }
        for (const scenario of scenarios) {
            const actions = await runReplayScenario(page, scenario);
            const safeActions = actions.map((action) => ({
                ...action,
                ...(action.diagnostic
                    ? { diagnostic: safe_browser_diagnostic(action.diagnostic) }
                    : {}),
            }));
            empty.actions.push(...safeActions);
            empty.scenarios.push({
                id: scenario.id,
                label: scenario.label,
                outcome:
                    actions.length === scenario.actions.length &&
                    actions.every((action) => action.outcome === "Succeeded")
                        ? "Succeeded"
                        : "Failed",
                actions: safeActions,
            });
        }
        await page.waitForLoadState("networkidle", { timeout: 2_000 }).catch(() => undefined);
        empty.animationPresent = await animation_present(page);
        const summaries = await replay_page_summaries(page);
        empty.dom = summaries.dom;
        empty.accessibility = summaries.accessibility;
        const partial =
            empty.unexpectedRequests.length > 0 ||
            integrityFailures.length > 0 ||
            empty.pageErrors.length > 0 ||
            empty.consoleErrors.length > 0 ||
            empty.failedRequests.length > 0 ||
            empty.actions.some((action) => action.outcome === "Failed");
        return {
            fidelity: partial ? "Partial" : "Verified",
            ...empty,
            diagnostics: partial
                ? ["offline replay encountered recorded runtime differences", ...integrityFailures]
                : [],
        };
    } catch {
        return {
            fidelity: "Unavailable",
            ...empty,
            diagnostics: ["offline replay is unavailable"],
        };
    } finally {
        await page?.close().catch(() => undefined);
        await context?.close().catch(() => undefined);
        await browser?.close().catch(() => undefined);
        if (server) await close(server).catch(() => undefined);
    }
}
