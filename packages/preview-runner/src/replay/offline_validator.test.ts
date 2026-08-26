import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ReplayArtifactWriter } from "./artifact_writer";
import { validateReplayArtifact } from "./offline_validator";

test("replays a recorded scenario from loopback resources only", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-offline-"));
    const origin = "http://preview.local.test";
    const writer = new ReplayArtifactWriter(root);
    try {
        const write = (url: string, resourceType: string, contentType: string, body: string) =>
            writer.writeResource({
                request: {
                    url: `${origin}${url}`,
                    method: "GET",
                    resourceType,
                    responseContentType: contentType,
                    variantHeaders: {},
                },
                responseHeaders: { "content-type": contentType },
                body: Buffer.from(body),
                kind: resourceType === "fetch" ? "response" : "asset",
            });

        await write(
            "/",
            "document",
            "text/html",
            `<!doctype html><link rel="stylesheet" href="/styles.css"><button>Load details</button><script type="module">fetch('/data.json').then((response) => response.json()).then((data) => document.body.dataset.data = data.label); document.querySelector('button').addEventListener('click', () => import('/lazy.js').then(({ load }) => load()));</script>`,
        );
        await write(
            "/styles.css",
            "stylesheet",
            "text/css",
            "@keyframes pulse { to { opacity: .5; } } button { animation: pulse 2s infinite; }",
        );
        await write(
            "/lazy.js",
            "script",
            "text/javascript",
            "export function load() { document.body.dataset.lazy = 'loaded'; }",
        );
        await write("/data.json", "fetch", "application/json", '{"label":"ready"}');
        await writer.writeManifest({
            version: 4,
            framework: "NextAppRouter",
            applications: [],
            surfaces: [],
            warnings: [],
        });

        const result = await validateReplayArtifact(root, {
            id: "load-details",
            label: "Load details",
            actions: [{ kind: "click", selector: { role: "button", name: "Load details" } }],
        });

        expect(result).toMatchObject({
            unexpectedRequests: [],
            pageErrors: [],
            consoleErrors: [],
            failedRequests: [],
        });
        expect(result.fidelity).toBe("Verified");
        expect(result.unexpectedRequests).toEqual([]);
        expect(result.animationPresent).toBe(true);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test("detects an animation that starts shortly after a replay action", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-offline-"));
    const writer = new ReplayArtifactWriter(root);
    try {
        await writer.writeResource({
            request: {
                url: "http://preview.local.test/",
                method: "GET",
                resourceType: "document",
                responseContentType: "text/html",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "text/html" },
            body: Buffer.from(
                `<!doctype html><button>Start animation</button><script>document.querySelector('button').addEventListener('click', () => setTimeout(() => document.querySelector('button').animate([{ opacity: 1 }, { opacity: 0.5 }], { duration: 1000, iterations: Infinity }), 150));</script>`,
            ),
            kind: "asset",
        });
        await writer.writeManifest({
            version: 4,
            framework: "NextAppRouter",
            applications: [],
            surfaces: [],
            warnings: [],
        });

        const result = await validateReplayArtifact(root, {
            id: "start-animation",
            label: "Start animation",
            actions: [{ kind: "click", selector: { role: "button", name: "Start animation" } }],
        });

        expect(result.fidelity).toBe("Verified");
        expect(result.animationPresent).toBe(true);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test("replays manifest-listed absolute static origins from verified local bytes", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-offline-"));
    const writer = new ReplayArtifactWriter(root);
    try {
        const write = (url: string, resourceType: string, contentType: string, body: string) =>
            writer.writeResource({
                request: {
                    url,
                    method: "GET",
                    resourceType,
                    responseContentType: contentType,
                    variantHeaders: {},
                },
                responseHeaders: { "content-type": contentType },
                body: Buffer.from(body),
                kind: "asset",
            });
        await write(
            "http://preview.local.test/",
            "document",
            "text/html",
            '<!doctype html><body><script defer src="https://cdn.preview.local.test/library.js"></script></body>',
        );
        await write(
            "https://cdn.preview.local.test/library.js",
            "script",
            "text/javascript",
            "document.body.dataset.cdn = 'loaded'",
        );
        await writer.writeManifest({
            version: 4,
            framework: "NextAppRouter",
            applications: [],
            surfaces: [],
            warnings: [],
        });

        const result = await validateReplayArtifact(root, {
            id: "default",
            label: "Default",
            actions: [],
        });

        expect(result.fidelity).toBe("Verified");
        expect(result.unexpectedRequests).toEqual([]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test("reports a partial replay when an offline WebSocket is attempted", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-offline-"));
    const writer = new ReplayArtifactWriter(root);
    try {
        await writer.writeResource({
            request: {
                url: "http://preview.local.test/",
                method: "GET",
                resourceType: "document",
                responseContentType: "text/html",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "text/html" },
            body: Buffer.from(
                "<!doctype html><script>new WebSocket('ws://socket.local.test/live')</script>",
            ),
            kind: "asset",
        });
        await writer.writeManifest({
            version: 4,
            framework: "NextAppRouter",
            applications: [],
            surfaces: [],
            warnings: [],
        });

        const result = await validateReplayArtifact(root, {
            id: "default",
            label: "Default",
            actions: [],
        });

        expect(result.fidelity).toBe("Partial");
        expect(result.unexpectedRequests).toEqual(["ws://socket.local.test/live"]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test("reports a partial replay when a manifest-listed subresource fails integrity", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-offline-"));
    const writer = new ReplayArtifactWriter(root);
    try {
        await writer.writeResource({
            request: {
                url: "http://preview.local.test/",
                method: "GET",
                resourceType: "document",
                responseContentType: "text/html",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "text/html" },
            body: Buffer.from('<!doctype html><script src="/missing.js"></script>'),
            kind: "asset",
        });
        const script = await writer.writeResource({
            request: {
                url: "http://preview.local.test/missing.js",
                method: "GET",
                resourceType: "script",
                responseContentType: "text/javascript",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "text/javascript" },
            body: Buffer.from("document.body.dataset.loaded = 'yes'"),
            kind: "asset",
        });
        rmSync(join(root, script.objectKey));
        await writer.writeManifest({
            version: 4,
            framework: "NextAppRouter",
            applications: [],
            surfaces: [],
            warnings: [],
        });

        const result = await validateReplayArtifact(root, {
            id: "default",
            label: "Default",
            actions: [],
        });

        expect(result.fidelity).toBe("Partial");
        expect(result.diagnostics).toContain("recorded resource integrity check failed");
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test("aborts unknown HTTP requests and marks the replay partial", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-offline-"));
    const writer = new ReplayArtifactWriter(root);
    try {
        await writer.writeResource({
            request: {
                url: "http://preview.local.test/",
                method: "GET",
                resourceType: "document",
                responseContentType: "text/html",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "text/html" },
            body: Buffer.from(
                '<!doctype html><img src="https://unknown.local.test/users/customer%40example.com?accessToken=browser-secret">',
            ),
            kind: "asset",
        });
        await writer.writeManifest({
            version: 4,
            framework: "NextAppRouter",
            applications: [],
            surfaces: [],
            warnings: [],
        });
        const result = await validateReplayArtifact(root, {
            id: "default",
            label: "Default",
            actions: [],
        });
        expect(result.fidelity).toBe("Partial");
        expect(result.unexpectedRequests).toEqual(["https://unknown.local.test/users/[redacted]"]);
        expect(JSON.stringify(result)).not.toContain("customer%40example.com");
        expect(JSON.stringify(result)).not.toContain("browser-secret");
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test("reports an unavailable replay when the document object is missing", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-offline-"));
    const writer = new ReplayArtifactWriter(root);
    try {
        const document = await writer.writeResource({
            request: {
                url: "http://preview.local.test/",
                method: "GET",
                resourceType: "document",
                responseContentType: "text/html",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "text/html" },
            body: Buffer.from("<!doctype html>"),
            kind: "asset",
        });
        rmSync(join(root, document.objectKey));
        await writer.writeManifest({
            version: 4,
            framework: "NextAppRouter",
            applications: [],
            surfaces: [],
            warnings: [],
        });
        const result = await validateReplayArtifact(root, {
            id: "default",
            label: "Default",
            actions: [],
        });
        expect(result.fidelity).toBe("Unavailable");
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test("returns bounded redacted browser evidence for review", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-offline-"));
    const writer = new ReplayArtifactWriter(root);
    try {
        await writer.writeResource({
            request: {
                url: "http://preview.local.test/",
                method: "GET",
                resourceType: "document",
                responseContentType: "text/html",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "text/html" },
            body: Buffer.from(
                '<!doctype html><main><h1>Replay</h1><button>Continue</button></main><script>console.error("Authorization=Bearer browser-secret")</script>',
            ),
            kind: "asset",
        });
        await writer.writeManifest({
            version: 4,
            framework: "NextAppRouter",
            applications: [],
            surfaces: [],
            warnings: [],
        });

        const result = await validateReplayArtifact(root, [
            { id: "initial", label: "Initial", actions: [] },
            {
                id: "continue",
                label: "Continue",
                actions: [{ kind: "click", selector: { role: "button", name: "Continue" } }],
            },
        ]);

        expect(result.scenarios.map((scenario) => scenario.id)).toEqual(["initial", "continue"]);
        expect(result.dom).toEqual(
            expect.objectContaining({ elementCount: 7, interactiveElementCount: 1 }),
        );
        expect(result.accessibility).toEqual(
            expect.objectContaining({
                landmarkCount: 1,
                headingCount: 1,
                labeledControlCount: 1,
                unlabeledControlCount: 0,
            }),
        );
        expect(result.consoleErrors).toEqual(["Authorization=[redacted] [redacted]"]);
        expect(JSON.stringify(result)).not.toContain("Bearer browser-secret");
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
