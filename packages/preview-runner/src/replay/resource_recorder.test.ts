import { expect, test } from "bun:test";

import { recordReplaySurface } from "./resource_recorder";

function fixture(): { server: ReturnType<typeof Bun.serve>; url: string } {
    const server = Bun.serve({
        port: 0,
        fetch(request) {
            const path = new URL(request.url).pathname;
            const responses: Record<string, [string, string]> = {
                "/": [
                    "text/html",
                    `<!doctype html><link rel="stylesheet" href="/styles.css"><button>Load details</button><img src="/image.png" alt="Preview"><script type="module">fetch('/data.json').then((response) => response.json()).then((data) => document.body.dataset.data = data.label); document.querySelector('button').addEventListener('click', () => import('/lazy.js').then(({ load }) => load()));</script>`,
                ],
                "/styles.css": [
                    "text/css",
                    "@keyframes pulse { to { opacity: .5; } } button { animation: pulse 2s infinite; }",
                ],
                "/lazy.js": [
                    "text/javascript",
                    "export function load() { document.body.insertAdjacentHTML('beforeend', '<span>loaded</span>'); }",
                ],
                "/data.json": ["application/json", '{"label":"ready"}'],
                "/image.png": [
                    "image/png",
                    Buffer.from(
                        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                        "base64",
                    ).toString("binary"),
                ],
            };
            const selected = responses[path];
            if (!selected) return new Response(null, { status: 404 });
            return new Response(selected[1], { headers: { "content-type": selected[0] } });
        },
    });
    return { server, url: `http://127.0.0.1:${server.port}` };
}

test("records policy-approved runtime resources and semantic action outcomes", async () => {
    const local = await fixture();
    try {
        const recorded = await recordReplaySurface(
            local.url,
            {
                id: "load-details",
                label: "Load details",
                actions: [
                    { kind: "click", selector: { role: "button", name: "Load details" } },
                    { kind: "waitFor", selector: { name: "loaded" } },
                ],
            },
            { policy: { sameOriginJsonPaths: ["/data.json"] } },
        );

        expect(recorded.resources.map((item) => item.kind)).toEqual(
            expect.arrayContaining(["document", "script", "stylesheet", "response"]),
        );
        expect(recorded.actions).toEqual([
            { index: 0, kind: "click", outcome: "Succeeded" },
            { index: 1, kind: "waitFor", outcome: "Succeeded" },
        ]);
        expect(recorded.pageErrors).toEqual([]);
        expect(recorded.consoleErrors).toEqual([]);
        expect(recorded.failedRequests).toEqual([]);
    } finally {
        local.server.stop();
    }
});

test("does not record same-origin JSON without project data approval", async () => {
    const local = await fixture();
    try {
        const recorded = await recordReplaySurface(local.url, {
            id: "default-deny-data",
            label: "Default deny data",
            actions: [],
        });

        expect(
            recorded.resources.some((resource) => new URL(resource.url).pathname === "/data.json"),
        ).toBe(false);
    } finally {
        local.server.stop();
    }
});

test("records the original browser transfer without requesting a mutable resource twice", async () => {
    let resourceRequests = 0;
    const server = Bun.serve({
        port: 0,
        fetch(request) {
            const path = new URL(request.url).pathname;
            if (path === "/") {
                return new Response(
                    `<!doctype html><script>fetch("/mutable.json").then(async (response) => { document.body.dataset.status = String(response.status); document.body.dataset.body = await response.text(); });</script>`,
                    { headers: { "content-type": "text/html" } },
                );
            }
            if (path === "/mutable.json") {
                resourceRequests += 1;
                const originalTransfer = resourceRequests === 1;
                return new Response(originalTransfer ? "original" : "duplicate", {
                    status: originalTransfer ? 201 : 202,
                    headers: { "content-type": "application/json" },
                });
            }
            return new Response(null, { status: 404 });
        },
    });
    const url = `http://127.0.0.1:${server.port}`;

    try {
        const recorded = await recordReplaySurface(
            url,
            {
                id: "mutable-response",
                label: "Mutable response",
                actions: [],
            },
            {
                navigationTimeoutMs: 10_000,
                policy: { sameOriginJsonPaths: ["/mutable.json"] },
            },
        );
        const mutableResponse = recorded.resources.find(
            (resource) => new URL(resource.url).pathname === "/mutable.json",
        );

        expect(resourceRequests).toBe(1);
        expect(mutableResponse?.responseStatus).toBe(201);
        expect(Buffer.from(mutableResponse?.body ?? []).toString()).toBe("original");
    } finally {
        server.stop();
    }
});

test("rejects oversized response metadata while allowing the browser load to finish", async () => {
    const oversizedBody = `${" ".repeat(1_100)}document.body.textContent = "loaded";`;
    const server = Bun.serve({
        port: 0,
        fetch(request) {
            const path = new URL(request.url).pathname;
            if (path === "/") {
                return new Response(`<!doctype html><body><script src="/oversized.js"></script>`, {
                    headers: { "content-type": "text/html" },
                });
            }
            if (path === "/oversized.js") {
                return new Response(oversizedBody, {
                    headers: {
                        "content-length": String(Buffer.byteLength(oversizedBody)),
                        "content-type": "text/javascript",
                    },
                });
            }
            return new Response(null, { status: 404 });
        },
    });
    const url = `http://127.0.0.1:${server.port}`;

    try {
        const recorded = await recordReplaySurface(
            url,
            {
                id: "oversized-response",
                label: "Oversized response",
                actions: [{ kind: "waitFor", selector: { name: "loaded" } }],
            },
            { policy: { maxResponseBytes: 1_000 } },
        );

        expect(recorded.actions[0]?.outcome).toBe("Succeeded");
        expect(
            recorded.resources.some(
                (resource) => new URL(resource.url).pathname === "/oversized.js",
            ),
        ).toBe(false);
    } finally {
        server.stop();
    }
});

test("discards an oversized streamed body while allowing the browser load to finish", async () => {
    const oversizedBody = new TextEncoder().encode(
        `${" ".repeat(1_100)}document.body.textContent = "stream-loaded";`,
    );
    const server = Bun.serve({
        port: 0,
        fetch(request) {
            const path = new URL(request.url).pathname;
            if (path === "/") {
                return new Response(
                    `<!doctype html><body><script src="/oversized-stream.js"></script>`,
                    { headers: { "content-type": "text/html" } },
                );
            }
            if (path === "/oversized-stream.js") {
                return new Response(
                    new ReadableStream({
                        start(controller) {
                            controller.enqueue(oversizedBody);
                            controller.close();
                        },
                    }),
                    { headers: { "content-type": "text/javascript" } },
                );
            }
            return new Response(null, { status: 404 });
        },
    });
    const url = `http://127.0.0.1:${server.port}`;

    try {
        const recorded = await recordReplaySurface(
            url,
            {
                id: "oversized-stream",
                label: "Oversized stream",
                actions: [{ kind: "waitFor", selector: { name: "stream-loaded" } }],
            },
            { policy: { maxResponseBytes: 1_000 } },
        );

        expect(recorded.actions[0]?.outcome).toBe("Succeeded");
        expect(
            recorded.resources.some(
                (resource) => new URL(resource.url).pathname === "/oversized-stream.js",
            ),
        ).toBe(false);
    } finally {
        server.stop();
    }
});

test("retains separately recorded safe request variants", async () => {
    const server = Bun.serve({
        port: 0,
        fetch(request) {
            const path = new URL(request.url).pathname;
            if (path === "/") {
                return new Response(
                    `<!doctype html><script>Promise.all([fetch("/localized.json", { headers: { "accept-language": "en" } }), fetch("/localized.json", { headers: { "accept-language": "fr" } })]);</script>`,
                    { headers: { "content-type": "text/html" } },
                );
            }
            if (path === "/localized.json") {
                return Response.json({ language: request.headers.get("accept-language") });
            }
            return new Response(null, { status: 404 });
        },
    });
    const url = `http://127.0.0.1:${server.port}`;

    try {
        const recorded = await recordReplaySurface(
            url,
            {
                id: "safe-variants",
                label: "Safe variants",
                actions: [],
            },
            { policy: { sameOriginJsonPaths: ["/localized.json"] } },
        );
        const variants = recorded.resources.filter(
            (resource) => new URL(resource.url).pathname === "/localized.json",
        );

        expect(variants).toHaveLength(2);
        expect(
            variants.map(
                (resource) =>
                    Object.entries(resource.variantHeaders).find(
                        ([name]) => name.toLowerCase() === "accept-language",
                    )?.[1],
            ),
        ).toEqual(expect.arrayContaining(["en", "fr"]));
    } finally {
        server.stop();
    }
});

test("records redirect status and location without a response body", async () => {
    const server = Bun.serve({
        port: 0,
        fetch(request) {
            const path = new URL(request.url).pathname;
            if (path === "/redirect") {
                return new Response("redirect-body", {
                    status: 302,
                    headers: { location: "/final" },
                });
            }
            if (path === "/final") {
                return new Response("<!doctype html><p>final</p>", {
                    headers: { "content-type": "text/html" },
                });
            }
            return new Response(null, { status: 404 });
        },
    });
    const url = `http://127.0.0.1:${server.port}`;

    try {
        const recorded = await recordReplaySurface(`${url}/redirect`, {
            id: "redirect-response",
            label: "Redirect response",
            actions: [],
        });
        const redirect = recorded.resources.find(
            (resource) => new URL(resource.url).pathname === "/redirect",
        );

        expect(redirect).toMatchObject({
            responseStatus: 302,
            redirectLocation: "/final",
        });
        expect(redirect?.body).toHaveLength(0);
    } finally {
        server.stop();
    }
});
