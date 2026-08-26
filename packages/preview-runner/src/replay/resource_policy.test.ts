import { expect, test } from "bun:test";

import {
    classifyReplayRequest,
    redactReplayResponseHeaders,
    type ReplayResourceRequest,
} from "./resource_policy";

const policy = {
    applicationOrigin: "https://preview.example.test",
    staticOrigins: ["https://cdn.example.test"],
    sameOriginJsonPaths: ["/api/replay-data"],
    allowedQueryParameters: { locale: ["en"] },
    maxResponseBytes: 1024,
};

function request(overrides: Partial<ReplayResourceRequest> = {}): ReplayResourceRequest {
    return {
        url: "https://preview.example.test/_next/static/chunk.js",
        method: "GET",
        resourceType: "script",
        headers: {},
        credentials: "omit" as const,
        responseHeaders: {},
        responseBytes: 10,
        ...overrides,
    };
}

test("captures a same-origin JavaScript asset", () => {
    expect(classifyReplayRequest(request(), policy)).toEqual({ decision: "capture" });
});

test("captures an approved anonymous same-origin JSON GET", () => {
    expect(
        classifyReplayRequest(
            request({
                url: "https://preview.example.test/api/replay-data",
                resourceType: "fetch",
                responseHeaders: { "content-type": "application/json" },
            }),
            policy,
        ),
    ).toEqual({ decision: "capture" });
});

test("blocks same-origin JSON outside the project-approved path policy", () => {
    expect(
        classifyReplayRequest(
            request({
                url: "https://preview.example.test/api/private-data",
                resourceType: "fetch",
                responseHeaders: { "content-type": "application/json" },
            }),
            policy,
        ),
    ).toEqual({ decision: "block" });
});

test("blocks non-JSON data even on a project-approved path", () => {
    expect(
        classifyReplayRequest(
            request({
                url: "https://preview.example.test/api/replay-data",
                resourceType: "fetch",
                responseHeaders: { "content-type": "text/html" },
            }),
            policy,
        ),
    ).toEqual({ decision: "block" });
});

test("default-denies same-origin JSON regardless of browser resource classification", () => {
    for (const resourceType of ["other", "prefetch", "preload", "script", "image"]) {
        expect(
            classifyReplayRequest(
                request({
                    url: "https://preview.example.test/api/private",
                    resourceType,
                    responseHeaders: { "content-type": "application/json" },
                }),
                { ...policy, sameOriginJsonPaths: [] },
            ),
        ).toEqual({ decision: "block" });
    }
});

test("captures MIME-led JSON classifications only at the exact owner-approved path", () => {
    for (const resourceType of ["other", "prefetch", "preload", "script", "image"]) {
        expect(
            classifyReplayRequest(
                request({
                    url: "https://preview.example.test/api/replay-data",
                    resourceType,
                    responseHeaders: { "content-type": "application/json" },
                }),
                policy,
            ),
        ).toEqual({ decision: "capture" });
        expect(
            classifyReplayRequest(
                request({
                    url: "https://preview.example.test/api/replay-data/private",
                    resourceType,
                    responseHeaders: { "content-type": "application/json" },
                }),
                policy,
            ),
        ).toEqual({ decision: "block" });
    }
});

test("does not let a static-origin allowlist authorize JSON data", () => {
    expect(
        classifyReplayRequest(
            request({
                url: "https://cdn.example.test/api/replay-data",
                resourceType: "other",
                responseHeaders: { "content-type": "application/json" },
            }),
            policy,
        ),
    ).toEqual({ decision: "block" });
});

test("default-denies standard and structured JSON MIME types", () => {
    for (const contentType of [
        "application/json; charset=utf-8",
        "application/problem+json",
        "application/manifest+json",
        "text/json",
    ]) {
        expect(
            classifyReplayRequest(
                request({
                    url: "https://preview.example.test/api/private",
                    resourceType: "other",
                    responseHeaders: { "content-type": contentType },
                }),
                { ...policy, sameOriginJsonPaths: [] },
            ),
        ).toEqual({ decision: "block" });
    }
});

test("does not treat an approved JSON path as document capture approval", () => {
    expect(
        classifyReplayRequest(
            request({
                url: "https://preview.example.test/api/replay-data",
                resourceType: "document",
                responseHeaders: { "content-type": "application/json" },
            }),
            policy,
        ),
    ).toEqual({ decision: "block" });
});

test("captures JSON below a bounded project-approved path prefix", () => {
    expect(
        classifyReplayRequest(
            request({
                url: "https://preview.example.test/api/products/featured",
                resourceType: "fetch",
                responseHeaders: { "content-type": "application/json" },
            }),
            { ...policy, sameOriginJsonPaths: ["/api/products/*"] },
        ),
    ).toEqual({ decision: "capture" });
});

test("blocks credentialed requests", () => {
    expect(classifyReplayRequest(request({ credentials: "include" }), policy).decision).toBe(
        "block",
    );
});

test("blocks credential-bearing custom request headers", () => {
    expect(
        classifyReplayRequest(request({ headers: { "x-api-key": "secret" } }), policy).decision,
    ).toBe("block");
});

test("blocks responses that set cookies", () => {
    expect(
        classifyReplayRequest(
            request({ responseHeaders: { "set-cookie": "session=secret" } }),
            policy,
        ).decision,
    ).toBe("block");
});

test("marks mutation requests unsupported", () => {
    expect(classifyReplayRequest(request({ method: "POST" }), policy).decision).toBe("unsupported");
});

test("marks WebSocket requests unsupported", () => {
    expect(
        classifyReplayRequest(
            request({ url: "wss://preview.example.test/socket", resourceType: "websocket" }),
            policy,
        ).decision,
    ).toBe("unsupported");
});

test("blocks static resources from origins outside the allowlist", () => {
    expect(
        classifyReplayRequest(
            request({ url: "https://unapproved.example.test/library.js" }),
            policy,
        ).decision,
    ).toBe("block");
});

test("blocks document responses until a document policy exists", () => {
    expect(classifyReplayRequest(request({ resourceType: "document" }), policy).decision).toBe(
        "block",
    );
});

test("blocks URLs with embedded credentials", () => {
    expect(
        classifyReplayRequest(
            request({ url: "https://user:password@preview.example.test/_next/static/chunk.js" }),
            policy,
        ).decision,
    ).toBe("block");
});

test("allows only explicitly approved query values", () => {
    expect(
        classifyReplayRequest(
            request({ url: "https://preview.example.test/_next/static/chunk.js?locale=en" }),
            policy,
        ).decision,
    ).toBe("capture");
    expect(
        classifyReplayRequest(
            request({ url: "https://preview.example.test/_next/static/chunk.js?locale=fr" }),
            policy,
        ).decision,
    ).toBe("block");
});

test("blocks token-like query parameter names", () => {
    expect(
        classifyReplayRequest(
            request({
                url: "https://preview.example.test/_next/static/chunk.js?access_token=secret",
            }),
            policy,
        ).decision,
    ).toBe("block");
});

test("blocks sensitive query names despite explicit value allowlists", () => {
    const sensitivePolicy = {
        ...policy,
        allowedQueryParameters: {
            accessToken: ["secret"],
            access_token: ["secret"],
            "access-token": ["secret"],
            clientsecret: ["secret"],
            key: ["secret"],
        },
    };

    for (const parameter of [
        "accessToken",
        "access_token",
        "access-token",
        "clientsecret",
        "key",
    ]) {
        expect(
            classifyReplayRequest(
                request({
                    url: `https://preview.example.test/_next/static/chunk.js?${parameter}=secret`,
                }),
                sensitivePolicy,
            ).decision,
        ).toBe("block");
    }
});

test("keeps only safe response content and cache headers", () => {
    expect(
        redactReplayResponseHeaders({
            "content-type": "application/javascript",
            "cache-control": "public, max-age=60",
            etag: '"resource"',
            authorization: "Bearer secret",
            "set-cookie": "session=secret",
        }),
    ).toEqual({
        "content-type": "application/javascript",
        "cache-control": "public, max-age=60",
        etag: '"resource"',
    });
});
