import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { ReplayArtifactWriter, type ReplayArtifactResourceInput } from "./artifact_writer";

const artifactRoots: string[] = [];

function writer(): ReplayArtifactWriter {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-artifact-"));
    artifactRoots.push(root);
    return new ReplayArtifactWriter(root);
}

function resource(
    url: string,
    body: Buffer,
    overrides: Partial<ReplayArtifactResourceInput> = {},
): ReplayArtifactResourceInput {
    return {
        request: {
            url: `https://preview.example.test${url}`,
            method: "GET" as const,
            resourceType: "script",
            responseContentType: "application/javascript",
            variantHeaders: { accept: "*/*" },
        },
        responseHeaders: {
            "content-type": "application/javascript",
            "set-cookie": "session=secret",
        },
        body,
        kind: "asset" as const,
        ...overrides,
    };
}

test("stores identical static bytes under one SHA-256 asset key", async () => {
    const artifactWriter = writer();

    const first = await artifactWriter.writeResource(resource("/one.js", Buffer.from("same")));
    const second = await artifactWriter.writeResource(resource("/two.js", Buffer.from("same")));

    expect(first.objectKey).toBe(second.objectKey);
    expect(first.objectKey).toMatch(/^assets\/[a-f0-9]{64}$/);
    expect(existsSync(join(artifactWriter.root, first.objectKey))).toBe(true);
});

test("uses content-addressed paths instead of raw request URLs", async () => {
    const artifactWriter = writer();

    const written = await artifactWriter.writeResource(
        resource("/../../credentials", Buffer.from("safe")),
    );

    expect(written.objectKey).toMatch(/^assets\/[a-f0-9]{64}$/);
    expect(existsSync(join(artifactWriter.root, "credentials"))).toBe(false);
});

test("rejects direct credential-bearing request variant headers", async () => {
    const artifactWriter = writer();

    for (const variantHeaders of [
        { authorization: "Bearer secret" },
        { cookie: "session=secret" },
        { "x-api-key": "secret" },
    ]) {
        await expect(
            artifactWriter.writeResource(
                resource("/one.js", Buffer.from("safe"), {
                    request: {
                        ...resource("/one.js", Buffer.from("safe")).request,
                        variantHeaders,
                    },
                }),
            ),
        ).rejects.toThrow("safe request variant headers");
    }
});

test("rejects URLs with credentials and unapproved query values", async () => {
    const artifactWriter = writer();

    await expect(
        artifactWriter.writeResource(
            resource("/one.js", Buffer.from("safe"), {
                request: {
                    ...resource("/one.js", Buffer.from("safe")).request,
                    url: "https://user:password@preview.example.test/one.js",
                },
            }),
        ),
    ).rejects.toThrow("unapproved identity value");
    await expect(
        artifactWriter.writeResource(resource("/one.js?token=secret", Buffer.from("safe"))),
    ).rejects.toThrow("unapproved identity value");
});

test("stores an explicitly approved query identity without its raw secret values", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-artifact-"));
    artifactRoots.push(root);
    const artifactWriter = new ReplayArtifactWriter(root, {
        allowedQueryParameters: { locale: ["en"] },
    });
    await artifactWriter.writeResource(resource("/one.js?locale=en", Buffer.from("safe")));
    const manifest = await artifactWriter.writeManifest({
        version: 4,
        framework: "NextAppRouter",
        applications: [],
        surfaces: [],
        warnings: [],
    });

    const stored = readFileSync(join(artifactWriter.root, manifest.objectKey), "utf8");
    expect(stored).toContain("locale=en");
    expect(stored).not.toContain("secret");
});

test("rejects allowlisted sensitive query parameter names in direct writer calls", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-artifact-"));
    artifactRoots.push(root);
    const artifactWriter = new ReplayArtifactWriter(root, {
        allowedQueryParameters: {
            accessToken: ["secret"],
            access_token: ["secret"],
            "access-token": ["secret"],
            clientsecret: ["secret"],
            key: ["secret"],
        },
    });

    for (const parameter of [
        "accessToken",
        "access_token",
        "access-token",
        "clientsecret",
        "key",
    ]) {
        await expect(
            artifactWriter.writeResource(
                resource(`/one.js?${parameter}=secret`, Buffer.from("safe")),
            ),
        ).rejects.toThrow("unapproved identity value");
    }
});

test("writes only normalized identities and safe response headers to the manifest", async () => {
    const artifactWriter = writer();
    await artifactWriter.writeResource(resource("/one.js", Buffer.from("same")));

    const manifest = await artifactWriter.writeManifest({
        version: 4,
        framework: "NextAppRouter",
        applications: [],
        surfaces: [],
        warnings: [],
        secrets: "do not publish",
    });
    const stored = JSON.parse(readFileSync(join(artifactWriter.root, manifest.objectKey), "utf8"));

    expect(stored.resources).toEqual([
        expect.objectContaining({
            request: expect.objectContaining({
                url: "https://preview.example.test/one.js",
                method: "GET",
                resourceType: "script",
            }),
            responseHeaders: { "content-type": "application/javascript" },
        }),
    ]);
    expect(stored.resources[0].request.variantHeaders).toEqual({ accept: "*/*" });
    expect(stored.resources[0].responseHeaders).not.toHaveProperty("set-cookie");
    expect(stored).not.toHaveProperty("secrets");
});

test("refuses one request identity with distinct byte hashes", async () => {
    const artifactWriter = writer();
    await artifactWriter.writeResource(resource("/one.js", Buffer.from("first")));

    await expect(
        artifactWriter.writeResource(resource("/one.js", Buffer.from("second"))),
    ).rejects.toThrow("different byte hashes");
});

test("persists approved response status and redirect location metadata", async () => {
    const artifactWriter = writer();
    await artifactWriter.writeResource({
        ...resource("/redirect", Buffer.from("redirect")),
        responseStatus: 302,
        responseStatusText: "Found",
        redirectLocation: "https://preview.example.test/final",
    } as ReplayArtifactResourceInput);
    const manifest = await artifactWriter.writeManifest({
        version: 4,
        framework: "NextAppRouter",
        applications: [],
        surfaces: [],
        warnings: [],
    });

    const stored = JSON.parse(readFileSync(join(artifactWriter.root, manifest.objectKey), "utf8"));
    expect(stored.resources[0]).toMatchObject({
        responseStatus: 302,
        responseStatusText: "Found",
        redirectLocation: "https://preview.example.test/final",
    });
});

process.on("exit", () => {
    for (const root of artifactRoots) rmSync(root, { recursive: true, force: true });
});
