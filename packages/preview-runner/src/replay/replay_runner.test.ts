import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ReplayArtifactWriter } from "./artifact_writer";
import {
    replayCaptureInputSchema,
    runReplayCapture,
    writeReplayBrowserAssets,
} from "./replay_runner";

test("rejects replay capture command input with unknown fields", () => {
    expect(() =>
        replayCaptureInputSchema.parse({
            url: "http://127.0.0.1:3000",
            artifactRoot: "/tmp/replay",
            scenario: { id: "default", label: "Default", actions: [] },
            script: "alert('unsafe')",
        }),
    ).toThrow();
});

test("accepts bounded adapter-owned browser asset paths", () => {
    expect(
        replayCaptureInputSchema.parse({
            url: "http://127.0.0.1:3000",
            artifactRoot: "/tmp/replay",
            scenario: { id: "default", label: "Default", actions: [] },
            browserAssets: [
                {
                    requestPath: "/_next/static/chunks/app.js",
                    sourcePath: "/workspace/apps/web/.next/static/chunks/app.js",
                    contentType: "application/javascript",
                },
            ],
        }).browserAssets,
    ).toHaveLength(1);
});

test("rejects replay scenario groups above the coordinate action budget", () => {
    const actions = Array.from({ length: 7 }, () => ({
        kind: "click" as const,
        selector: { role: "button", name: "Continue" },
    }));

    expect(() =>
        replayCaptureInputSchema.parse({
            url: "http://127.0.0.1:3000",
            artifactRoot: "/tmp/replay",
            scenario: { id: "compatibility", label: "Compatibility", actions: [] },
            scenarios: [
                { id: "first", label: "First", actions },
                { id: "second", label: "Second", actions },
            ],
        }),
    ).toThrow("replay coordinate action limit");
});

test("writes a replay artifact and reports its offline fidelity", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-capture-"));
    const server = Bun.serve({
        port: 0,
        fetch(request) {
            const path = new URL(request.url).pathname;
            if (path === "/") {
                return new Response(
                    "<!doctype html><button>Continue</button><script>document.querySelector('button').addEventListener('click', () => document.body.dataset.complete = 'yes')</script>",
                    { headers: { "content-type": "text/html" } },
                );
            }
            return new Response(null, { status: 404 });
        },
    });
    try {
        const result = await runReplayCapture({
            url: `http://127.0.0.1:${server.port}`,
            artifactRoot: root,
            scenario: {
                id: "continue",
                label: "Continue",
                actions: [{ kind: "click", selector: { role: "button", name: "Continue" } }],
            },
        });

        expect(result.artifactKey).toBe("artifact.json");
        expect(
            JSON.parse(readFileSync(join(root, "artifact.json"), "utf8")).resources,
        ).toHaveLength(1);
        expect(result.fidelity).toBe("Verified");
        expect(result.resourceCount).toBe(1);
        expect(result.packageBytes).toBeGreaterThan(0);
        expect(result.captureDurationMs).toBeGreaterThanOrEqual(0);
        expect(result.validationOutcome).toBe("Verified");
        expect(result.evidence.scenarios).toEqual([
            {
                id: "continue",
                label: "Continue",
                outcome: "Succeeded",
                actions: [{ index: 0, kind: "click", outcome: "Succeeded" }],
            },
        ]);
        expect(result.evidence.dom).toEqual(
            expect.objectContaining({
                elementCount: expect.any(Number),
                interactiveElementCount: 1,
            }),
        );
        expect(result.evidence.accessibility).toEqual(
            expect.objectContaining({
                labeledControlCount: 1,
                unlabeledControlCount: 0,
            }),
        );
        expect(result.evidence.consoleDiagnostics).toEqual([]);
        expect(result.evidence.failedRequestDiagnostics).toEqual([]);
    } finally {
        server.stop();
        rmSync(root, { recursive: true, force: true });
    }
});

test("redacts compound secrets and customer identifiers before evidence persistence", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-evidence-redaction-"));
    const server = Bun.serve({
        port: 0,
        fetch() {
            return new Response(
                `<!doctype html><script>console.error(JSON.stringify({ accessToken: "super-secret-value", api_keys: ["private-api-key"], clientSecret: "private-client-secret", profile: { customer_identifier: "customer-42", email: "customer@example.com", phoneNumber: "+1 415 555 0199" } }))</script>`,
                { headers: { "content-type": "text/html" } },
            );
        },
    });
    try {
        const result = await runReplayCapture({
            url: `http://127.0.0.1:${server.port}`,
            artifactRoot: root,
            scenario: { id: "default", label: "Default", actions: [] },
        });
        const persistedEvidence = JSON.stringify(result.evidence);

        expect(result.evidence.consoleDiagnostics).toEqual([
            '{"accessToken":"[redacted]","api_keys":"[redacted]","clientSecret":"[redacted]","profile":{"customer_identifier":"[redacted]","email":"[redacted]","phoneNumber":"[redacted]"}}',
        ]);
        expect(persistedEvidence).not.toContain("super-secret-value");
        expect(persistedEvidence).not.toContain("private-api-key");
        expect(persistedEvidence).not.toContain("private-client-secret");
        expect(persistedEvidence).not.toContain("customer-42");
        expect(persistedEvidence).not.toContain("customer@example.com");
        expect(persistedEvidence).not.toContain("+1 415 555 0199");
    } finally {
        server.stop();
        rmSync(root, { recursive: true, force: true });
    }
});

test("packages an adapter-bound browser asset into the replay artifact", async () => {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-browser-assets-"));
    const assetPath = join(root, "lazy.js");
    const artifactRoot = join(root, "artifact");
    writeFileSync(assetPath, "export const lazy = true;");
    try {
        const writer = new ReplayArtifactWriter(artifactRoot);
        await writeReplayBrowserAssets(
            writer,
            "http://127.0.0.1:3000",
            [
                {
                    requestPath: "/_next/static/chunks/lazy.js",
                    sourcePath: assetPath,
                    contentType: "application/javascript",
                },
            ],
            5_000_000,
        );
        await writer.writeManifest({
            version: 4,
            framework: "NextAppRouter",
            applications: [],
            surfaces: [],
            warnings: [],
        });
        const artifact = JSON.parse(readFileSync(join(artifactRoot, "artifact.json"), "utf8"));

        expect(artifact.resources).toContainEqual(
            expect.objectContaining({
                request: expect.objectContaining({
                    url: "http://127.0.0.1:3000/_next/static/chunks/lazy.js",
                }),
                objectKey: expect.stringMatching(/^assets\/[a-f0-9]{64}$/),
            }),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
