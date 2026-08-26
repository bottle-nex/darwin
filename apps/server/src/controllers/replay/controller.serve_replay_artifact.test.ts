import { createServer } from "node:http";
import { Readable, Writable } from "node:stream";

import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import express from "express";

import { open_browser } from "../../../../../packages/preview-runner/src/browser";
import { PRODUCT_DIFF_REPLAY_IFRAME_SANDBOX } from "../../../../web/lib/product-diff-replay";
import { ENV } from "../../configs/env";
import { replay_host_boundary } from "../../middlewares/middleware.replay_host";

const product_diff = { findFirst: mock() };
const storage = {
    read_product_diff_object: mock(),
    stream_product_diff_object: mock(),
};

mock.module("@trymatcha/database", () => ({ prisma: { productDiff: product_diff } }));
mock.module("../../services/service.storage", () => ({ default: storage }));

const { default: ReplayAccess } = await import("../../services/service.product_diff_replay_access");
const { default: serve_replay_artifact_controller } =
    await import("./controller.serve_replay_artifact");

const environment = ENV as unknown as Record<string, unknown>;
const original_enabled = environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED;
const original_origin = environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN;
const original_web_url = environment.SERVER_WEB_URL;
const artifact_id = "replay/web/billing/default/desktop/head/artifact.json";
const artifact_prefix = "product-diffs/project-1/product-diff-1";
const resource_hash = "a".repeat(64);
const script_hash = "b".repeat(64);
const response_hash = "c".repeat(64);
type BrowserPage = Awaited<ReturnType<Awaited<ReturnType<typeof open_browser>>["newPage"]>>;
const artifact_manifest = {
    version: 4,
    framework: "NextAppRouter",
    applications: [],
    surfaces: [],
    warnings: [],
    resources: [
        {
            request: {
                url: "http://127.0.0.1:3100/billing",
                method: "GET",
                resourceType: "document",
                responseContentType: "text/html",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "text/html" },
            objectKey: `assets/${resource_hash}`,
            sha256: resource_hash,
            responseStatus: 200,
            responseStatusText: "OK",
            redirectLocation: null,
        },
        {
            request: {
                url: "https://cdn.customer.test/app.js",
                method: "GET",
                resourceType: "script",
                responseContentType: "application/javascript",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "application/javascript" },
            objectKey: `assets/${script_hash}`,
            sha256: script_hash,
            responseStatus: 200,
            responseStatusText: "OK",
            redirectLocation: null,
        },
        {
            request: {
                url: "https://cdn.customer.test/data.json",
                method: "GET",
                resourceType: "fetch",
                responseContentType: "application/json",
                variantHeaders: {},
            },
            responseHeaders: { "content-type": "application/json" },
            objectKey: `responses/${response_hash}`,
            sha256: response_hash,
            responseStatus: 200,
            responseStatusText: "OK",
            redirectLocation: null,
        },
    ],
};
let active_artifact_manifest = structuredClone(artifact_manifest);
let resource_bodies = new Map<string, Buffer>();

class ReplayResponse extends Writable {
    statusCode = 200;
    headers = new Map<string, string | string[]>();
    chunks: Buffer[] = [];
    jsonBody: unknown;

    _write(chunk: Buffer, _encoding: string, callback: () => void) {
        this.chunks.push(Buffer.from(chunk));
        callback();
    }

    status(code: number) {
        this.statusCode = code;
        return this;
    }

    json(value: unknown) {
        this.jsonBody = value;
        this.end();
        return this;
    }

    setHeader(name: string, value: string | string[]) {
        this.headers.set(name.toLowerCase(), value);
        return this;
    }

    getHeader(name: string) {
        return this.headers.get(name.toLowerCase());
    }

    redirect(code: number, location: string) {
        this.statusCode = code;
        this.setHeader("Location", location);
        this.end();
        return this;
    }

    body() {
        return Buffer.concat(this.chunks).toString("utf8");
    }
}

function replay_token() {
    return ReplayAccess.issue({
        productDiffId: "product-diff-1",
        projectId: "project-1",
        artifactId: artifact_id,
    });
}

function request(
    path: string,
    token: string,
    capability = false,
    content = false,
    destination?: string,
) {
    const origin = content
        ? ReplayAccess.artifact_content_origin("product-diff-1", artifact_id)
        : ReplayAccess.artifact_origin("product-diff-1", artifact_id);
    const replay_path = path.replace(/^\//, "").split("/").filter(Boolean);
    return {
        method: "GET",
        params: { replay_path },
        originalUrl: `/api/v1/replay${path}${capability ? `?capability=${encodeURIComponent(token)}` : ""}`,
        query: capability ? { capability: token } : {},
        headers: {
            host: origin.host,
            ...(capability ? {} : { cookie: `__Host-matcha_replay_capability=${token}` }),
            ...(destination ? { "sec-fetch-dest": destination } : {}),
        },
        get(name: string) {
            return this.headers[name.toLowerCase() as keyof typeof this.headers];
        },
    };
}

beforeEach(() => {
    environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = true;
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = "https://replay.trymatcha.test";
    product_diff.findFirst.mockReset();
    storage.read_product_diff_object.mockReset();
    storage.stream_product_diff_object.mockReset();
    active_artifact_manifest = structuredClone(artifact_manifest);
    resource_bodies = new Map([
        [resource_hash, Buffer.from("<main>billing replay</main>")],
        [script_hash, Buffer.from("document.body.dataset.gateway = 'loaded'")],
        [response_hash, Buffer.from('{"status":"recorded"}')],
    ]);
    product_diff.findFirst.mockResolvedValue({
        status: "Ready",
        artifactPrefix: artifact_prefix,
        manifest: {
            version: 4,
            framework: "NextAppRouter",
            applications: [{ id: "web", applicationPath: "apps/web", adapterId: "next" }],
            surfaces: [
                {
                    id: "billing",
                    applicationId: "web",
                    label: "Billing",
                    states: [
                        {
                            id: "default",
                            label: "Default",
                            viewports: [
                                {
                                    id: "desktop",
                                    label: "Desktop",
                                    width: 1280,
                                    height: 800,
                                    base: {
                                        artifactKey: null,
                                        fidelity: "Unavailable",
                                        diagnostics: [],
                                    },
                                    head: {
                                        artifactKey: artifact_id,
                                        fidelity: "Verified",
                                        diagnostics: [],
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
            warnings: [],
        },
    });
    storage.read_product_diff_object.mockImplementation(async (key: string) =>
        key.endsWith("artifact.json")
            ? Buffer.from(JSON.stringify(active_artifact_manifest))
            : (resource_bodies.get(key.split("/").at(-1) ?? "") ?? Buffer.alloc(0)),
    );
    storage.stream_product_diff_object.mockResolvedValue({
        body: Readable.from(["<main>billing replay</main>"]),
        size: 27,
        contentType: "text/html",
        cacheControl: "private, max-age=31536000, immutable",
    });
});

afterAll(() => {
    environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = original_enabled;
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = original_origin;
    environment.SERVER_WEB_URL = original_web_url;
});

test("exchanges the URL capability for an artifact-only host cookie", async () => {
    const token = replay_token();
    const res = new ReplayResponse();

    await serve_replay_artifact_controller(request("/", token, true) as never, res as never);

    expect(res.statusCode).toBe(302);
    expect(res.getHeader("location")).toBe("/billing");
    const cookie = String(res.getHeader("set-cookie"));
    expect(cookie).toContain(`__Host-matcha_replay_capability=${token}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=None");
    expect(cookie).toContain("Partitioned");
    expect(cookie).not.toContain("Domain=");
    expect(String(res.getHeader("location"))).not.toContain(token);
    expect(storage.stream_product_diff_object).not.toHaveBeenCalled();
});

test("serves a trusted shell instead of customer code on the launch origin", async () => {
    const token = replay_token();
    const res = new ReplayResponse();

    await serve_replay_artifact_controller(request("/billing", token) as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body()).toContain('title="Interactive replay"');
    expect(res.body()).toContain(
        'sandbox="allow-scripts allow-same-origin allow-forms allow-modals"',
    );
    expect(res.body()).toContain("content-54cbdb565f06b483773d88e71726e5d9c92d03b996443709cab6");
    expect(res.body()).not.toContain("<main>billing replay</main>");
    expect(res.getHeader("content-type")).toBe("text/html; charset=utf-8");
    expect(res.getHeader("cache-control")).toBe("no-store");
    expect(res.getHeader("origin-agent-cluster")).toBe("?1");
    expect(res.getHeader("x-content-type-options")).toBe("nosniff");
    expect(res.getHeader("x-robots-tag")).toBe("noindex");
    expect(String(res.getHeader("content-security-policy"))).toContain("default-src 'none'");
    expect(String(res.getHeader("content-security-policy"))).toContain(
        "frame-src https://content-54cbdb565f06b483773d88e71726e5d9c92d03b996443709cab6.replay.trymatcha.test",
    );
    expect(String(res.getHeader("content-security-policy"))).toContain(
        "frame-ancestors http://localhost:3000",
    );
    expect(res.getHeader("set-cookie")).toBeUndefined();
});

test("serves a recorded third-party resource through its virtual gateway path", async () => {
    const token = replay_token();
    const deliveryPath = `/__matcha_replay_resource/${Buffer.from("https://cdn.customer.test").toString("base64url")}/app.js`;
    const res = new ReplayResponse();

    await serve_replay_artifact_controller(
        request(deliveryPath, token, false, true, "script") as never,
        res as never,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body()).toBe("document.body.dataset.gateway = 'loaded'");
    expect(storage.read_product_diff_object).toHaveBeenCalledWith(
        `${artifact_prefix}/replay/web/billing/default/desktop/head/assets/${script_hash}`,
        50_000_000,
    );
});

test("issues and serves a VM-shaped application-qualified V4 artifact", async () => {
    const token = replay_token();
    const res = new ReplayResponse();

    await serve_replay_artifact_controller(
        request("/billing", token, false, true, "iframe") as never,
        res as never,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body()).toContain("billing replay");
    expect(storage.read_product_diff_object).toHaveBeenCalledWith(
        `${artifact_prefix}/replay/web/billing/default/desktop/head/artifact.json`,
        5_000_000,
    );
    expect(storage.read_product_diff_object).toHaveBeenCalledWith(
        `${artifact_prefix}/replay/web/billing/default/desktop/head/assets/${resource_hash}`,
        50_000_000,
    );
});

test("serves customer documents only as nested content and rejects top-level execution", async () => {
    const token = replay_token();
    const nested = new ReplayResponse();
    const topLevel = new ReplayResponse();

    await serve_replay_artifact_controller(
        request("/billing", token, false, true, "iframe") as never,
        nested as never,
    );
    await serve_replay_artifact_controller(
        request("/billing", token, false, true, "document") as never,
        topLevel as never,
    );

    expect(nested.statusCode).toBe(200);
    expect(nested.body()).toContain("<main>billing replay</main>");
    expect(String(nested.getHeader("content-security-policy"))).toContain(
        "frame-ancestors 'self' https://54cbdb565f06b483773d88e71726e5d9c92d03b996443709cab6.replay.trymatcha.test http://localhost:3000",
    );
    expect(topLevel.statusCode).toBe(401);
    expect(topLevel.body()).not.toContain("billing replay");
});

test("resolves unvirtualized paths only against the recorded document origin", async () => {
    const collidingHash = "d".repeat(64);
    active_artifact_manifest.resources.unshift({
        request: {
            url: "https://cdn.customer.test/billing",
            method: "GET",
            resourceType: "fetch",
            responseContentType: "text/html",
            variantHeaders: {},
        },
        responseHeaders: { "content-type": "text/html" },
        objectKey: `responses/${collidingHash}`,
        sha256: collidingHash,
        responseStatus: 200,
        responseStatusText: "OK",
        redirectLocation: null,
    });
    resource_bodies.set(collidingHash, Buffer.from("third-party collision"));
    const token = replay_token();
    const res = new ReplayResponse();

    await serve_replay_artifact_controller(
        request("/billing", token, false, true, "iframe") as never,
        res as never,
    );

    expect(res.body()).toContain("billing replay");
    expect(res.body()).not.toContain("third-party collision");
});

test("keeps delivered replay networking inside the gateway in a normal browser", async () => {
    let externalRequests = 0;
    const external = createServer((_req, res) => {
        externalRequests += 1;
        res.writeHead(200, { "content-type": "application/javascript" });
        res.end("document.body.dataset.leaked = 'yes'");
    });
    const externalPort = await listen(external);
    const externalOrigin = `http://127.0.0.1:${externalPort}`;
    let blockedRequests = 0;
    const blocked = createServer((_req, res) => {
        blockedRequests += 1;
        res.writeHead(200, { "content-type": "application/json" });
        res.end('{"status":"leaked"}');
    });
    const blockedPort = await listen(blocked);
    const blockedOrigin = `http://127.0.0.1:${blockedPort}`;
    active_artifact_manifest.resources[1]!.request.url = `${externalOrigin}/app.js`;
    active_artifact_manifest.resources[2]!.request.url = `${externalOrigin}/data.json`;
    resource_bodies.set(
        resource_hash,
        Buffer.from(
            `<main>billing replay</main><img src="${blockedOrigin}/pixel"><script src="${externalOrigin}/app.js"></script><script>const recordedOrigin=["http","://","127.0.0.1:${externalPort}"].join(""); const blockedOrigin=["http","://","127.0.0.1:${blockedPort}"].join(""); fetch(recordedOrigin+"/data.json",{credentials:"omit"}).then((response) => response.json()).then((data) => document.body.dataset.response = data.status); fetch(blockedOrigin+"/leak").catch(() => undefined)</script>`,
        ),
    );

    const app = express();
    app.use(replay_host_boundary);
    app.get("/api/v1/replay", serve_replay_artifact_controller);
    app.get("/api/v1/replay/{*replay_path}", serve_replay_artifact_controller);
    const gateway = createServer(app);
    const gatewayPort = await listen(gateway);
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = `http://replay.localhost:${gatewayPort}`;
    const token = replay_token();
    const browser = await open_browser();
    const replayUrl = ReplayAccess.launch_url(token, artifact_id);
    const wrapper = createServer((_req, res) => {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(`<iframe sandbox="allow-scripts allow-same-origin" src="${replayUrl}"></iframe>`);
    });
    const wrapperPort = await listen(wrapper);
    environment.SERVER_WEB_URL = `http://app.replay.localhost:${wrapperPort}`;

    try {
        const page = await browser.newPage();
        const pageErrors: string[] = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto(replayUrl, { waitUntil: "domcontentloaded", timeout: 5_000 });
        await page.waitForTimeout(1_000);
        expect(pageErrors).toEqual([]);
        const directReplayFrame = await frame_containing(page, "billing replay");
        expect(
            await directReplayFrame.evaluate<string>('document.body.dataset.gateway ?? ""'),
        ).toBe("loaded");
        expect(
            await directReplayFrame.evaluate<string>('document.body.dataset.response ?? ""'),
        ).toBe("recorded");
        expect(
            await directReplayFrame.evaluate<string | undefined>("document.body.dataset.leaked"),
        ).toBeUndefined();

        await page.goto(`http://app.replay.localhost:${wrapperPort}`, {
            waitUntil: "domcontentloaded",
            timeout: 5_000,
        });
        await page.waitForTimeout(1_000);
        const replayFrame = await frame_containing(page, "billing replay");
        expect(await replayFrame.content()).toContain("billing replay");
        expect(await replayFrame.evaluate<string>('document.body.dataset.gateway ?? ""')).toBe(
            "loaded",
        );
        expect(await replayFrame.evaluate<string>('document.body.dataset.response ?? ""')).toBe(
            "recorded",
        );
        expect(externalRequests).toBe(0);
        expect(blockedRequests).toBe(0);
    } finally {
        await browser.close();
        await close(wrapper);
        await close(gateway);
        await close(external);
        await close(blocked);
    }
}, 15_000);

function listen(server: ReturnType<typeof createServer>): Promise<number> {
    return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            server.off("error", reject);
            const address = server.address();
            if (!address || typeof address === "string") {
                reject(new Error("test server did not bind"));
                return;
            }
            resolve(address.port);
        });
    });
}

function close(server: ReturnType<typeof createServer>): Promise<void> {
    return new Promise((resolve) => server.close(() => resolve()));
}

async function frame_containing(page: BrowserPage, text: string) {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
        for (const frame of page.frames()) {
            try {
                if ((await frame.locator("body").innerText()).includes(text)) return frame;
            } catch {
                continue;
            }
        }
        await page.waitForTimeout(25);
    }
    throw new Error(
        `No replay frame contained ${text}; frame URLs: ${page
            .frames()
            .map((frame) => frame.url())
            .join(", ")}`,
    );
}

test("blocks same-frame external navigation in direct and embedded replay", async () => {
    let navigationRequests = 0;
    const destination = createServer((_req, res) => {
        navigationRequests += 1;
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<main>external destination</main>");
    });
    const destinationPort = await listen(destination);
    const destinationOrigin = `http://127.0.0.1:${destinationPort}`;
    resource_bodies.set(resource_hash, Buffer.from("<main>billing replay</main>"));
    const detailsHash = "d".repeat(64);
    active_artifact_manifest.resources.push({
        request: {
            url: "http://127.0.0.1:3100/billing/details",
            method: "GET",
            resourceType: "document",
            responseContentType: "text/html",
            variantHeaders: {},
        },
        responseHeaders: { "content-type": "text/html" },
        objectKey: `assets/${detailsHash}`,
        sha256: detailsHash,
        responseStatus: 200,
        responseStatusText: "OK",
        redirectLocation: null,
    });
    resource_bodies.set(detailsHash, Buffer.from("<main>recorded details</main>"));

    const app = express();
    app.use(replay_host_boundary);
    app.get("/api/v1/replay", serve_replay_artifact_controller);
    app.get("/api/v1/replay/{*replay_path}", serve_replay_artifact_controller);
    const gateway = createServer(app);
    const gatewayPort = await listen(gateway);
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = `http://replay.localhost:${gatewayPort}`;
    const token = replay_token();
    const replayUrl = ReplayAccess.launch_url(token, artifact_id);
    const wrapper = createServer((_req, res) => {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(`<iframe sandbox="allow-scripts allow-same-origin" src="${replayUrl}"></iframe>`);
    });
    const wrapperPort = await listen(wrapper);
    environment.SERVER_WEB_URL = `http://app.replay.localhost:${wrapperPort}`;
    const browser = await open_browser();
    const attempts = ["assign", "replace", "href", "form", "meta"] as const;
    const entryPoints = [replayUrl, `http://app.replay.localhost:${wrapperPort}`];

    try {
        for (const entryPoint of entryPoints) {
            for (const attempt of attempts) {
                const page = await browser.newPage();
                await page.goto(entryPoint, { waitUntil: "domcontentloaded", timeout: 5_000 });
                const replayFrame = await frame_containing(page, "billing replay");
                const target = JSON.stringify(`${destinationOrigin}/${attempt}`);
                const navigationScript = {
                    assign: `location.assign(${target})`,
                    replace: `location.replace(${target})`,
                    href: `location.href=${target}`,
                    form: `(()=>{const form=document.createElement("form");form.action=${target};document.body.append(form);form.submit()})()`,
                    meta: `(()=>{const meta=document.createElement("meta");meta.httpEquiv="refresh";meta.content="0;url="+${target};document.head.append(meta)})()`,
                }[attempt];
                await replayFrame.evaluate(navigationScript).catch(() => undefined);
                await page.waitForTimeout(150);
                await page.close();
            }
            const localPage = await browser.newPage();
            await localPage.goto(entryPoint, { waitUntil: "domcontentloaded", timeout: 5_000 });
            const replayFrame = await frame_containing(localPage, "billing replay");
            await replayFrame.evaluate('location.assign("/billing/details")');
            expect(await frame_containing(localPage, "recorded details")).toBeDefined();
            await localPage.close();
        }

        expect(navigationRequests).toBe(0);
    } finally {
        await browser.close();
        await close(wrapper);
        await close(gateway);
        await close(destination);
    }
}, 30_000);

test("renders recorded same-origin nested frames without allowing outbound navigation", async () => {
    let outboundRequests = 0;
    const destination = createServer((_req, res) => {
        outboundRequests += 1;
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<main>external nested frame</main>");
    });
    const destinationPort = await listen(destination);
    const destinationOrigin = `http://127.0.0.1:${destinationPort}`;
    const nestedFrameHash = "e".repeat(64);
    active_artifact_manifest.resources.push({
        request: {
            url: "http://127.0.0.1:3100/billing/frame",
            method: "GET",
            resourceType: "document",
            responseContentType: "text/html",
            variantHeaders: {},
        },
        responseHeaders: { "content-type": "text/html" },
        objectKey: `assets/${nestedFrameHash}`,
        sha256: nestedFrameHash,
        responseStatus: 200,
        responseStatusText: "OK",
        redirectLocation: null,
    });
    resource_bodies.set(
        resource_hash,
        Buffer.from(
            '<main>billing replay</main><iframe title="Recorded details" src="/billing/frame"></iframe>',
        ),
    );
    resource_bodies.set(
        nestedFrameHash,
        Buffer.from(
            `<main>recorded nested frame</main><script>setTimeout(()=>{const destination=["http","://","127.0.0.1:${destinationPort}"].join("");location.assign(destination+"/leak")},50)</script>`,
        ),
    );

    const app = express();
    app.use(replay_host_boundary);
    app.get("/api/v1/replay", serve_replay_artifact_controller);
    app.get("/api/v1/replay/{*replay_path}", serve_replay_artifact_controller);
    const gateway = createServer(app);
    const gatewayPort = await listen(gateway);
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = `http://replay.localhost:${gatewayPort}`;
    const token = replay_token();
    const replayUrl = ReplayAccess.launch_url(token, artifact_id);
    const wrapper = createServer((_req, res) => {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(`<iframe sandbox="allow-scripts allow-same-origin" src="${replayUrl}"></iframe>`);
    });
    const wrapperPort = await listen(wrapper);
    environment.SERVER_WEB_URL = `http://app.replay.localhost:${wrapperPort}`;
    const browser = await open_browser();

    try {
        for (const entryPoint of [replayUrl, `http://app.replay.localhost:${wrapperPort}`]) {
            const page = await browser.newPage();
            await page.goto(entryPoint, { waitUntil: "domcontentloaded", timeout: 5_000 });
            const nestedFrame = await frame_containing(page, "recorded nested frame");
            expect(nestedFrame.url()).toContain("/billing/frame");
            await page.waitForTimeout(250);
            expect(page.frames().some((frame) => frame.url().startsWith(destinationOrigin))).toBe(
                false,
            );
            await page.close();
        }

        expect(outboundRequests).toBe(0);
    } finally {
        await browser.close();
        await close(wrapper);
        await close(gateway);
        await close(destination);
    }
}, 20_000);

test("submits recorded forms directly and through the product iframe without opening outbound targets", async () => {
    let outboundRequests = 0;
    const destination = createServer((_req, res) => {
        outboundRequests += 1;
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<main>external form destination</main>");
    });
    const destinationPort = await listen(destination);
    const destinationOrigin = `http://127.0.0.1:${destinationPort}`;
    const submittedHash = "f".repeat(64);
    active_artifact_manifest.resources.push({
        request: {
            url: "http://127.0.0.1:3100/billing/submitted?choice=green",
            method: "GET",
            resourceType: "document",
            responseContentType: "text/html",
            variantHeaders: {},
        },
        responseHeaders: { "content-type": "text/html" },
        objectKey: `assets/${submittedHash}`,
        sha256: submittedHash,
        responseStatus: 200,
        responseStatusText: "OK",
        redirectLocation: null,
    });
    resource_bodies.set(
        resource_hash,
        Buffer.from(
            `<main>billing replay</main><form action="/billing/submitted" method="get"><input name="choice" value="green"><button id="recorded-submit" type="submit">Submit recorded form</button></form><form action="${destinationOrigin}/leak" method="get"><button id="external-submit" type="submit">Submit external form</button></form><form action="${destinationOrigin}/top" method="get" target="_top"><button id="top-submit" type="submit">Submit top form</button></form><form action="${destinationOrigin}/popup" method="get" target="_blank"><button id="popup-submit" type="submit">Submit popup form</button></form>`,
        ),
    );
    resource_bodies.set(submittedHash, Buffer.from("<main>recorded form submission</main>"));

    const app = express();
    app.use(replay_host_boundary);
    app.get("/api/v1/replay", serve_replay_artifact_controller);
    app.get("/api/v1/replay/{*replay_path}", serve_replay_artifact_controller);
    const gateway = createServer(app);
    const gatewayPort = await listen(gateway);
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = `http://replay.localhost:${gatewayPort}`;
    const token = replay_token();
    const replayUrl = ReplayAccess.launch_url(token, artifact_id);
    const wrapper = createServer((_req, res) => {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(
            `<iframe sandbox="${PRODUCT_DIFF_REPLAY_IFRAME_SANDBOX}" src="${replayUrl}"></iframe>`,
        );
    });
    const wrapperPort = await listen(wrapper);
    environment.SERVER_WEB_URL = `http://app.replay.localhost:${wrapperPort}`;
    const browser = await open_browser();
    const entryPoints = [replayUrl, `http://app.replay.localhost:${wrapperPort}`];

    try {
        for (const entryPoint of entryPoints) {
            const recordedPage = await browser.newPage();
            await recordedPage.goto(entryPoint, {
                waitUntil: "domcontentloaded",
                timeout: 5_000,
            });
            const recordedFrame = await frame_containing(recordedPage, "billing replay");
            await recordedFrame.locator("#recorded-submit").click();
            expect(await frame_containing(recordedPage, "recorded form submission")).toBeDefined();
            await recordedPage.close();

            for (const button of ["external-submit", "top-submit", "popup-submit"]) {
                const outboundPage = await browser.newPage();
                await outboundPage.goto(entryPoint, {
                    waitUntil: "domcontentloaded",
                    timeout: 5_000,
                });
                const outboundFrame = await frame_containing(outboundPage, "billing replay");
                await outboundFrame.locator(`#${button}`).click();
                await outboundPage.waitForTimeout(200);
                expect(
                    outboundPage
                        .frames()
                        .some((frame) => frame.url().startsWith(destinationOrigin)),
                ).toBe(false);
                await outboundPage.close();
            }
        }

        expect(outboundRequests).toBe(0);
        expect(PRODUCT_DIFF_REPLAY_IFRAME_SANDBOX).not.toContain("allow-popups");
        expect(PRODUCT_DIFF_REPLAY_IFRAME_SANDBOX).not.toContain("allow-top-navigation");
    } finally {
        await browser.close();
        await close(wrapper);
        await close(gateway);
        await close(destination);
    }
}, 30_000);

test("returns not found without reading an object for a path absent from the artifact manifest", async () => {
    const token = replay_token();
    const res = new ReplayResponse();

    await serve_replay_artifact_controller(request("/admin", token) as never, res as never);

    expect(res.statusCode).toBe(404);
    expect(storage.stream_product_diff_object).not.toHaveBeenCalled();
});

test("rejects a valid capability presented on another artifact origin", async () => {
    const token = replay_token();
    const req = request("/billing", token);
    req.headers.host = ReplayAccess.artifact_origin(
        "product-diff-1",
        "replay/web/billing/default/desktop/base/artifact.json",
    ).host;
    const res = new ReplayResponse();

    await serve_replay_artifact_controller(req as never, res as never);

    expect(res.statusCode).toBe(401);
    expect(storage.read_product_diff_object).not.toHaveBeenCalled();
});
