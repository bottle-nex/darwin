import type { CDPSession, Locator, Page } from "playwright";

import { open_browser, open_replay_context } from "../browser";
import {
    replayScenarioSchema,
    type ReplayAction,
    type ReplayScenario,
    type ReplaySelector,
} from "../contract";
import {
    classifyReplayRequest,
    type ReplayResourcePolicy,
    type ReplayResourceRequest,
} from "./resource_policy";
import { replayRequestIdentityKey } from "./artifact_writer";

export type ReplayRecordedResourceKind =
    "document" | "script" | "stylesheet" | "image" | "font" | "media" | "wasm" | "response";

export interface ReplayRecordedResource {
    kind: ReplayRecordedResourceKind;
    url: string;
    method: "GET" | "HEAD";
    resourceType: string;
    responseContentType: string | null;
    variantHeaders: Record<string, string | undefined>;
    responseHeaders: Record<string, string | undefined>;
    body: Uint8Array;
    responseStatus: number;
    responseStatusText: string;
    redirectLocation: string | null;
}

export interface ReplayActionOutcome {
    index: number;
    kind: ReplayAction["kind"];
    outcome: "Succeeded" | "Failed";
    diagnostic?: string;
}

export interface ReplaySurfaceRecording {
    resources: ReplayRecordedResource[];
    actions: ReplayActionOutcome[];
    pageErrors: string[];
    consoleErrors: string[];
    failedRequests: string[];
}

export interface ReplayRecorderOptions {
    policy?: Partial<Omit<ReplayResourcePolicy, "applicationOrigin">>;
    viewport?: { width: number; height: number };
    navigationTimeoutMs?: number;
}

interface ReplayPausedResponse {
    requestId: string;
    request: {
        url: string;
        method: string;
        headers: Record<string, string>;
    };
    resourceType: string;
    responseStatusCode?: number;
    responseStatusText?: string;
    responseHeaders?: Array<{ name: string; value: string }>;
    networkId?: string;
}

interface ReplayResponseStream {
    resource: ReplayRecordedResource;
    chunks: Buffer[];
    length: number;
    discarded: boolean;
    loadingFinished: boolean;
    resolve: () => void;
    completion: Promise<void>;
}

function safe_headers(headers: Record<string, string>): Record<string, string | undefined> {
    return Object.fromEntries(
        Object.entries(headers).flatMap(([name, value]) =>
            name.toLowerCase() === "accept" || name.toLowerCase() === "accept-language"
                ? [[name, value]]
                : [],
        ),
    );
}

function response_content_type(headers: Record<string, string>): string | null {
    return (
        Object.entries(headers).find(([name]) => name.toLowerCase() === "content-type")?.[1] ?? null
    );
}

function header_value(headers: Record<string, string>, name: string): string | null {
    return Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1] ?? null;
}

function response_length(headers: Record<string, string>): number | null {
    const value = header_value(headers, "content-length");
    if (!value || !/^\d+$/.test(value)) return null;
    const length = Number(value);
    return Number.isSafeInteger(length) ? length : null;
}

function resource_kind(resourceType: string): ReplayRecordedResourceKind {
    if (resourceType === "document") return "document";
    if (resourceType === "fetch" || resourceType === "xhr") return "response";
    if (
        resourceType === "script" ||
        resourceType === "stylesheet" ||
        resourceType === "image" ||
        resourceType === "font" ||
        resourceType === "media" ||
        resourceType === "wasm"
    ) {
        return resourceType;
    }
    return "response";
}

function response_error(error: unknown): string {
    return error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300);
}

function redacted_url(value: string): string {
    try {
        const url = new URL(value);
        return `${url.origin}${url.pathname}`;
    } catch {
        return "unparseable request";
    }
}

function replay_policy(baseUrl: string, options: ReplayRecorderOptions): ReplayResourcePolicy {
    return {
        applicationOrigin: new URL(baseUrl).origin,
        staticOrigins: options.policy?.staticOrigins ?? [],
        sameOriginJsonPaths: options.policy?.sameOriginJsonPaths ?? [],
        allowedQueryParameters: options.policy?.allowedQueryParameters ?? {},
        maxResponseBytes: options.policy?.maxResponseBytes ?? 5_000_000,
    };
}

function request_credentials(headers: Record<string, string>): "omit" | "include" | "same-origin" {
    return Object.keys(headers).some((name) => name.toLowerCase() === "cookie")
        ? "include"
        : "omit";
}

function response_request(
    response: ReplayPausedResponse,
    responseHeaders: Record<string, string>,
): ReplayResourceRequest {
    return {
        url: response.request.url,
        method: response.request.method,
        resourceType: response.resourceType.toLowerCase(),
        headers: response.request.headers,
        credentials: request_credentials(response.request.headers),
        responseHeaders,
        responseBytes: response_length(responseHeaders) ?? 0,
    };
}

function cdp_response_headers(
    headers: Array<{ name: string; value: string }> | undefined,
): Record<string, string> {
    const values: Record<string, string> = {};
    for (const header of headers ?? []) {
        const existing = values[header.name];
        values[header.name] =
            existing === undefined ? header.value : `${existing}\n${header.value}`;
    }
    return values;
}

function bodyless_response(method: string, status: number): boolean {
    return method.toUpperCase() === "HEAD" || status === 204 || status === 205 || status === 304;
}

function recorded_response(
    response: ReplayPausedResponse,
    responseHeaders: Record<string, string>,
): ReplayRecordedResource {
    const resourceType = response.resourceType.toLowerCase();
    return {
        kind: resource_kind(resourceType),
        url: response.request.url,
        method: response.request.method.toUpperCase() as "GET" | "HEAD",
        resourceType,
        responseContentType: response_content_type(responseHeaders),
        variantHeaders: safe_headers(response.request.headers),
        responseHeaders,
        body: Buffer.alloc(0),
        responseStatus: response.responseStatusCode!,
        responseStatusText: response.responseStatusText ?? "",
        redirectLocation: header_value(responseHeaders, "location"),
    };
}

function response_identity_key(
    resource: ReplayRecordedResource,
    policy: ReplayResourcePolicy,
): string {
    return replayRequestIdentityKey(
        {
            url: resource.url,
            method: resource.method,
            resourceType: resource.resourceType,
            responseContentType: resource.responseContentType,
            variantHeaders: resource.variantHeaders,
        },
        policy.allowedQueryParameters,
    );
}

function append_stream_chunk(stream: ReplayResponseStream, data: string, maximum: number): void {
    if (stream.discarded || data.length === 0) return;
    const chunkLength = Buffer.byteLength(data, "base64");
    if (stream.length + chunkLength > maximum) {
        stream.discarded = true;
        stream.chunks = [];
        stream.length = 0;
        return;
    }
    stream.chunks.push(Buffer.from(data, "base64"));
    stream.length += chunkLength;
}

function complete_stream(
    requestId: string,
    stream: ReplayResponseStream,
    streams: Map<string, ReplayResponseStream>,
    resources: Map<string, ReplayRecordedResource>,
    policy: ReplayResourcePolicy,
): void {
    if (!stream.loadingFinished) return;
    streams.delete(requestId);
    if (!stream.discarded) {
        stream.resource.body = Buffer.concat(stream.chunks, stream.length);
        resources.set(response_identity_key(stream.resource, policy), stream.resource);
    }
    stream.resolve();
}

async function capture_paused_response(
    session: CDPSession,
    response: ReplayPausedResponse,
    policy: ReplayResourcePolicy,
    resources: Map<string, ReplayRecordedResource>,
    streams: Map<string, ReplayResponseStream>,
): Promise<void> {
    if (response.responseStatusCode === undefined) {
        await session.send("Fetch.continueRequest", { requestId: response.requestId });
        return;
    }
    const responseHeaders = cdp_response_headers(response.responseHeaders);
    const replayRequest = response_request(response, responseHeaders);
    if (replayRequest.method !== "GET" && replayRequest.method !== "HEAD") {
        await session.send("Fetch.continueResponse", { requestId: response.requestId });
        return;
    }
    const policyRequest =
        replayRequest.resourceType === "document"
            ? { ...replayRequest, resourceType: "script" }
            : replayRequest;
    const accepted = classifyReplayRequest(policyRequest, policy);
    const resource = recorded_response(response, responseHeaders);
    const redirect = response.responseStatusCode >= 300 && response.responseStatusCode < 400;
    if (accepted.decision !== "capture") {
        await session.send("Fetch.continueResponse", { requestId: response.requestId });
        return;
    }
    if (redirect || bodyless_response(replayRequest.method, response.responseStatusCode)) {
        resources.set(response_identity_key(resource, policy), resource);
        await session.send("Fetch.continueResponse", { requestId: response.requestId });
        return;
    }
    if (!response.networkId) {
        await session.send("Fetch.continueResponse", { requestId: response.requestId });
        return;
    }

    let resolve: () => void = () => undefined;
    const completion = new Promise<void>((complete) => {
        resolve = complete;
    });
    const stream: ReplayResponseStream = {
        resource,
        chunks: [],
        length: 0,
        discarded: false,
        loadingFinished: false,
        resolve,
        completion,
    };
    streams.set(response.networkId, stream);
    const streamContent = session.send("Network.streamResourceContent", {
        requestId: response.networkId,
    });
    try {
        await session.send("Fetch.continueResponse", { requestId: response.requestId });
        const { bufferedData } = await streamContent;
        append_stream_chunk(stream, bufferedData, policy.maxResponseBytes);
    } catch (error) {
        streams.delete(response.networkId);
        stream.resolve();
        throw error;
    }
    complete_stream(response.networkId, stream, streams, resources, policy);
    await stream.completion;
}

function resolve_selector(page: Page, selector: ReplaySelector): Locator {
    if (selector.testId) return page.getByTestId(selector.testId);
    if (selector.role) return page.getByRole(selector.role as never, { name: selector.name });
    if (selector.label) return page.getByLabel(selector.label);
    return page.getByText(selector.name ?? "", { exact: true });
}

async function run_action(page: Page, action: ReplayAction): Promise<void> {
    const locator = resolve_selector(page, action.selector);
    const count = await locator.count();
    if (count !== 1) throw new Error(`semantic selector matched ${count} elements`);
    if (action.kind === "click") return locator.click();
    if (action.kind === "fill") return locator.fill(action.value);
    if (action.kind === "select") return locator.selectOption(action.value).then(() => undefined);
    if (action.kind === "check") {
        if (action.checked === false) return locator.uncheck();
        return locator.check();
    }
    return locator.waitFor({ state: "visible" });
}

export async function runReplayScenario(
    page: Page,
    scenario: ReplayScenario,
): Promise<ReplayActionOutcome[]> {
    const actions: ReplayActionOutcome[] = [];
    for (const [index, action] of scenario.actions.entries()) {
        try {
            await run_action(page, action);
            actions.push({ index, kind: action.kind, outcome: "Succeeded" });
        } catch (error) {
            actions.push({
                index,
                kind: action.kind,
                outcome: "Failed",
                diagnostic: response_error(error),
            });
            break;
        }
    }
    return actions;
}

export async function recordReplaySurface(
    baseUrl: string,
    inputScenario: ReplayScenario,
    options: ReplayRecorderOptions = {},
): Promise<ReplaySurfaceRecording> {
    const scenario = replayScenarioSchema.parse(inputScenario);
    const browser = await open_browser();
    const context = await open_replay_context(browser, { viewport: options.viewport });
    const page = await context.newPage();
    const resources = new Map<string, ReplayRecordedResource>();
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    const responseCaptures = new Set<Promise<void>>();
    const responseStreams = new Map<string, ReplayResponseStream>();
    const policy = replay_policy(baseUrl, options);
    const session = await context.newCDPSession(page);

    await session.send("Network.enable");
    await session.send("Fetch.enable", {
        patterns: [{ urlPattern: "*", requestStage: "Response" }],
    });

    page.on("pageerror", (error) => pageErrors.push(response_error(error)));
    page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300));
    });
    page.on("requestfailed", (request) => failedRequests.push(redacted_url(request.url())));
    session.on("Network.dataReceived", ({ requestId, data }) => {
        const stream = responseStreams.get(requestId);
        if (stream && data) append_stream_chunk(stream, data, policy.maxResponseBytes);
    });
    session.on("Network.loadingFinished", ({ requestId }) => {
        const stream = responseStreams.get(requestId);
        if (!stream) return;
        stream.loadingFinished = true;
        complete_stream(requestId, stream, responseStreams, resources, policy);
    });
    session.on("Network.loadingFailed", ({ requestId }) => {
        const stream = responseStreams.get(requestId);
        if (!stream) return;
        responseStreams.delete(requestId);
        stream.resolve();
    });
    session.on("Fetch.requestPaused", (response) => {
        const capture = capture_paused_response(
            session,
            response,
            policy,
            resources,
            responseStreams,
        ).catch((error) => {
            pageErrors.push(response_error(error));
        });
        responseCaptures.add(capture);
        void capture.finally(() => responseCaptures.delete(capture));
    });

    try {
        await page.goto(baseUrl, {
            waitUntil: "networkidle",
            timeout: options.navigationTimeoutMs ?? 10_000,
        });
        const actions = await runReplayScenario(page, scenario);
        await page.waitForLoadState("networkidle", { timeout: 2_000 }).catch(() => undefined);
        while (responseCaptures.size > 0) {
            await Promise.all([...responseCaptures]);
        }
        return {
            resources: [...resources.values()],
            actions,
            pageErrors,
            consoleErrors,
            failedRequests,
        };
    } finally {
        await session.detach().catch(() => undefined);
        await page.close().catch(() => undefined);
        await context.close().catch(() => undefined);
        await browser.close().catch(() => undefined);
    }
}
