import { createHash } from "node:crypto";
import { linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Logger from "@trymatcha/logger";
import type { ProductDiffManifestV4 } from "@trymatcha/types";
import { expect, test } from "bun:test";
import type { Sandbox } from "e2b";

import { build_replay_archive_command } from "./service.product_diff_replay_archive";
import ProductDiffReplayArtifacts from "./service.product_diff_replay_artifacts";

const plan = {
    applications: [{ id: "web", applicationPath: "apps/web", adapterId: "next" }],
    surfaces: [
        {
            id: "billing",
            applicationId: "web",
            label: "Billing",
            sourcePaths: ["app/billing/page.tsx"],
            entry: { kind: "route" as const, path: "/billing" },
            rootLayoutMode: "inherit" as const,
            states: [{ id: "default", label: "Default", scenarios: [] }],
            viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
        },
        {
            id: "footer",
            applicationId: "web",
            label: "Footer",
            sourcePaths: ["components/Footer.tsx"],
            entry: { kind: "component" as const, targetId: "footer" },
            rootLayoutMode: "inherit" as const,
            states: [{ id: "default", label: "Default", scenarios: [] }],
            viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
        },
    ],
};

function replay_manifest(
    artifactKey = "replay/web/footer/default/desktop/head/artifact.json",
): ProductDiffManifestV4 {
    return {
        version: 4,
        framework: "NextAppRouter",
        applications: plan.applications,
        surfaces: [
            {
                id: "footer",
                applicationId: "web",
                label: "Footer",
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
                                    artifactKey,
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
    };
}

test("builds a V4 manifest without hiding a verified surface behind a partial one", () => {
    const manifest = ProductDiffReplayArtifacts.build_manifest({
        plan,
        framework: "NextAppRouter",
        captures: [
            {
                revision: "head",
                applicationId: "web",
                surfaceId: "billing",
                stateId: "default",
                viewportId: "desktop",
                artifactKey: "replay/web/billing/default/desktop/head/artifact.json",
                fidelity: "Partial",
                diagnostics: ["offline replay requires unavailable data"],
                resourceCount: 5,
                packageBytes: 4096,
                captureDurationMs: 1000,
                validationOutcome: "Partial",
                evidence: {
                    scenarios: [
                        {
                            id: "submit",
                            label: "Submit",
                            outcome: "Failed",
                            actions: [
                                {
                                    index: 0,
                                    kind: "click",
                                    outcome: "Failed",
                                    diagnostic:
                                        'accessToken="super-secret-value" customerId="customer-42"',
                                },
                            ],
                        },
                    ],
                    dom: null,
                    accessibility: null,
                    consoleDiagnostics: [
                        '{"apiKey":"private-api-key","email":"customer@example.com"}',
                    ],
                    failedRequestDiagnostics: [
                        "https://api.example.test/customers/customer@example.com?token=secret",
                    ],
                },
            },
            {
                revision: "head",
                applicationId: "web",
                surfaceId: "footer",
                stateId: "default",
                viewportId: "desktop",
                artifactKey: "replay/web/footer/default/desktop/head/artifact.json",
                fidelity: "Verified",
                diagnostics: [],
                resourceCount: 8,
                packageBytes: 8192,
                captureDurationMs: 1200,
                validationOutcome: "Verified",
                evidence: {
                    scenarios: [],
                    dom: {
                        elementCount: 8,
                        interactiveElementCount: 1,
                        visibleTextLength: 30,
                    },
                    accessibility: {
                        landmarkCount: 1,
                        headingCount: 1,
                        labeledControlCount: 1,
                        unlabeledControlCount: 0,
                    },
                    consoleDiagnostics: [],
                    failedRequestDiagnostics: [],
                },
            },
        ],
        warnings: [],
    });

    expect(manifest.version).toBe(4);
    expect(
        manifest.surfaces.find((surface) => surface.id === "footer")?.states[0]?.viewports[0]?.head
            .fidelity,
    ).toBe("Verified");
    expect(
        manifest.surfaces.find((surface) => surface.id === "billing")?.states[0]?.viewports[0]?.head
            .fidelity,
    ).toBe("Partial");
    expect(
        manifest.surfaces.find((surface) => surface.id === "billing")?.states[0]?.viewports[0]?.head
            .evidence,
    ).toEqual(
        expect.objectContaining({
            scenarios: [
                expect.objectContaining({
                    actions: [expect.objectContaining({ diagnostic: "Replay action failed" })],
                }),
            ],
            consoleDiagnostics: ["1 console error; details redacted"],
            failedRequestDiagnostics: ["1 replay request failed; details redacted"],
        }),
    );
    expect(JSON.stringify(manifest)).not.toContain("super-secret-value");
    expect(JSON.stringify(manifest)).not.toContain("private-api-key");
    expect(JSON.stringify(manifest)).not.toContain("customer@example.com");
    expect(JSON.stringify(manifest)).not.toContain("token=secret");
    expect(ProductDiffReplayArtifacts.has_valid_result(manifest)).toBe(true);
});

test("reports no valid replay when every revision is unavailable", () => {
    const manifest = ProductDiffReplayArtifacts.build_manifest({
        plan,
        framework: "NextAppRouter",
        captures: [],
        warnings: [],
    });

    expect(ProductDiffReplayArtifacts.has_valid_result(manifest)).toBe(false);
});

test("matches duplicate surface coordinates to the owning application capture", () => {
    const sharedSurface = {
        id: "dashboard",
        label: "Dashboard",
        sourcePaths: ["app/dashboard/page.tsx"],
        entry: { kind: "route" as const, path: "/dashboard" },
        rootLayoutMode: "inherit" as const,
        states: [{ id: "default", label: "Default", scenarios: [] }],
        viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
    };
    const capture = (applicationId: string, artifactKey: string) => ({
        applicationId,
        revision: "head" as const,
        surfaceId: "dashboard",
        stateId: "default",
        viewportId: "desktop",
        artifactKey,
        fidelity: "Verified" as const,
        diagnostics: [],
        resourceCount: 1,
        packageBytes: 256,
        captureDurationMs: 10,
        validationOutcome: "Verified" as const,
    });
    const manifest = ProductDiffReplayArtifacts.build_manifest({
        plan: {
            applications: [
                { id: "web", applicationPath: "apps/web" },
                { id: "admin", applicationPath: "apps/admin" },
            ],
            surfaces: [
                { ...sharedSurface, applicationId: "web" },
                { ...sharedSurface, applicationId: "admin" },
            ],
        },
        framework: "NextAppRouter",
        captures: [
            capture("web", "replay/web/dashboard/default/desktop/head/artifact.json"),
            capture("admin", "replay/admin/dashboard/default/desktop/head/artifact.json"),
        ],
        warnings: [],
    });

    expect(manifest.surfaces[0]?.states[0]?.viewports[0]?.head.artifactKey).toBe(
        "replay/web/dashboard/default/desktop/head/artifact.json",
    );
    expect(manifest.surfaces[1]?.states[0]?.viewports[0]?.head.artifactKey).toBe(
        "replay/admin/dashboard/default/desktop/head/artifact.json",
    );

    const archiveCommand = build_replay_archive_command(
        "/home/user/output/replay",
        "/home/user/output/replay.tar.gz",
        manifest,
    );
    expect(archiveCommand).toContain("'web/dashboard/default/desktop/head'");
    expect(archiveCommand).toContain("'admin/dashboard/default/desktop/head'");
});

function replay_archive(
    options: {
        extraArtifact?: boolean;
        extraUnreferencedResource?: boolean;
        hardLinkedArtifact?: boolean;
        mismatchedResourceHash?: boolean;
    } = {},
): {
    archive: Uint8Array;
    dispose: () => void;
} {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-upload-test-"));
    const replayRoot = join(root, "replay");
    const captureRoot = join(replayRoot, "web", "footer", "default", "desktop", "head");
    const assetBody = "asset bytes";
    const hash = options.mismatchedResourceHash
        ? "a".repeat(64)
        : createHash("sha256").update(assetBody).digest("hex");
    mkdirSync(captureRoot, { recursive: true });
    if (!options.hardLinkedArtifact) {
        mkdirSync(join(captureRoot, "assets"));
        writeFileSync(join(captureRoot, "assets", hash), assetBody);
        if (options.extraUnreferencedResource) {
            writeFileSync(join(captureRoot, "assets", "b".repeat(64)), "unreferenced bytes");
        }
    }
    writeFileSync(
        join(captureRoot, "artifact.json"),
        JSON.stringify({
            resources: options.hardLinkedArtifact
                ? []
                : [
                      {
                          request: { responseContentType: "application/javascript" },
                          objectKey: `assets/${hash}`,
                      },
                  ],
        }),
    );
    if (options.extraArtifact || options.hardLinkedArtifact) {
        const extraRoot = join(replayRoot, "web", "billing", "default", "desktop", "head");
        mkdirSync(extraRoot, { recursive: true });
        const extraManifest = join(extraRoot, "artifact.json");
        if (options.hardLinkedArtifact) linkSync(join(captureRoot, "artifact.json"), extraManifest);
        else writeFileSync(extraManifest, JSON.stringify({ resources: [] }));
    }
    const archivePath = join(root, "replay.tar.gz");
    const archived = Bun.spawnSync([
        "tar",
        "--format=ustar",
        "-czf",
        archivePath,
        "-C",
        replayRoot,
        ".",
    ]);
    if (archived.exitCode !== 0) throw new Error("could not create replay upload fixture");
    return {
        archive: readFileSync(archivePath),
        dispose: () => rmSync(root, { recursive: true, force: true }),
    };
}

function replay_archive_sandbox(archive: Uint8Array): Sandbox {
    return {
        commands: { run: async () => ({ exitCode: 0, stdout: "", stderr: "" }) },
        files: {
            getInfo: async () => ({ size: archive.byteLength, type: "file" }),
            read: async () =>
                new ReadableStream<Uint8Array>({
                    start(controller) {
                        controller.enqueue(archive);
                        controller.close();
                    },
                }),
        },
    } as unknown as Sandbox;
}

function replay_directory_fixture(): {
    replayRoot: string;
    archivePath: string;
    dispose: () => void;
} {
    const root = mkdtempSync(join(tmpdir(), "matcha-replay-directory-test-"));
    const replayRoot = join(root, "replay");
    const verifiedRoot = join(replayRoot, "web", "footer", "default", "desktop", "head");
    const unavailableRoot = join(replayRoot, "web", "billing", "default", "desktop", "head");
    const assetBody = "verified asset bytes";
    const hash = createHash("sha256").update(assetBody).digest("hex");
    mkdirSync(join(verifiedRoot, "assets"), { recursive: true });
    mkdirSync(unavailableRoot, { recursive: true });
    writeFileSync(join(verifiedRoot, "assets", hash), assetBody);
    writeFileSync(
        join(verifiedRoot, "artifact.json"),
        JSON.stringify({
            resources: [
                {
                    request: { responseContentType: "application/javascript" },
                    objectKey: `assets/${hash}`,
                },
            ],
        }),
    );
    writeFileSync(join(unavailableRoot, "partial.tmp"), "failed coordinate output");
    return {
        replayRoot,
        archivePath: join(root, "selected.tar.gz"),
        dispose: () => rmSync(root, { recursive: true, force: true }),
    };
}

function replay_directory_sandbox(replayRoot: string, archivePath: string): Sandbox {
    return {
        commands: {
            run: async (command: string) => {
                const localCommand = command.replace(
                    "/home/user/output/replay.tar.gz",
                    archivePath,
                );
                const result = Bun.spawnSync(["sh", "-c", localCommand]);
                return {
                    exitCode: result.exitCode,
                    stdout: result.stdout.toString(),
                    stderr: result.stderr.toString(),
                };
            },
        },
        files: {
            getInfo: async () => {
                const body = readFileSync(archivePath);
                return { size: body.byteLength, type: "file" };
            },
            read: async () => {
                const body = readFileSync(archivePath);
                return new ReadableStream<Uint8Array>({
                    start(controller) {
                        controller.enqueue(body);
                        controller.close();
                    },
                });
            },
        },
    } as unknown as Sandbox;
}

test("uploads content-addressed replay objects before the V4 manifest", async () => {
    const fixture = replay_archive();
    const uploaded: string[] = [];
    const sandbox = replay_archive_sandbox(fixture.archive);
    const manifest = replay_manifest();
    try {
        await ProductDiffReplayArtifacts.upload(
            sandbox,
            "/home/user/output/replay",
            "product-diffs/project/product-diff",
            manifest,
            { info: () => undefined } as unknown as Logger,
            {
                put: async (key) => {
                    uploaded.push(key);
                },
                remove_prefix: async () => undefined,
            },
        );

        const assetIndex = uploaded.findIndex((key) => /\/assets\/[a-f0-9]{64}$/.test(key));
        expect(assetIndex).toBeGreaterThanOrEqual(0);
        expect(assetIndex).toBeLessThan(uploaded.length - 1);
        expect(uploaded).toContain(
            "product-diffs/project/product-diff/replay/web/footer/default/desktop/head/artifact.json",
        );
        expect(uploaded.at(-1)).toBe("product-diffs/project/product-diff/manifest.json");
    } finally {
        fixture.dispose();
    }
});

test("uploads a verified artifact while excluding real files from an unavailable coordinate", async () => {
    const fixture = replay_directory_fixture();
    const uploaded: string[] = [];
    try {
        const count = await ProductDiffReplayArtifacts.upload(
            replay_directory_sandbox(fixture.replayRoot, fixture.archivePath),
            fixture.replayRoot,
            "product-diffs/project/product-diff",
            replay_manifest(),
            { info: () => undefined } as unknown as Logger,
            {
                put: async (key) => {
                    uploaded.push(key);
                },
                remove_prefix: async () => undefined,
            },
        );

        expect(count).toBe(3);
        expect(uploaded).toContain(
            "product-diffs/project/product-diff/replay/web/footer/default/desktop/head/artifact.json",
        );
        expect(uploaded.some((key) => key.includes("billing"))).toBe(false);
        expect(uploaded.at(-1)).toBe("product-diffs/project/product-diff/manifest.json");
    } finally {
        fixture.dispose();
    }
});

test("removes only the Product Diff prefix after an upload failure", async () => {
    const fixture = replay_archive();
    const removed: string[] = [];
    const sandbox = replay_archive_sandbox(fixture.archive);
    const manifest = replay_manifest();
    try {
        await expect(
            ProductDiffReplayArtifacts.upload(
                sandbox,
                "/home/user/output/replay",
                "product-diffs/project/product-diff",
                manifest,
                { info: () => undefined } as unknown as Logger,
                {
                    put: async () => {
                        throw new Error("storage unavailable");
                    },
                    remove_prefix: async (prefix) => {
                        removed.push(prefix);
                    },
                },
            ),
        ).rejects.toThrow("storage unavailable");
        expect(removed).toEqual(["product-diffs/project/product-diff"]);
    } finally {
        fixture.dispose();
    }
});

test("waits for the failed upload batch before removing its prefix", async () => {
    const fixture = replay_archive();
    let delayedUploadFinished = false;
    let cleanupStartedAfterBatch = false;
    let calls = 0;
    const sandbox = replay_archive_sandbox(fixture.archive);
    const manifest = replay_manifest();
    try {
        await expect(
            ProductDiffReplayArtifacts.upload(
                sandbox,
                "/home/user/output/replay",
                "product-diffs/project/product-diff",
                manifest,
                { info: () => undefined } as unknown as Logger,
                {
                    put: async () => {
                        calls += 1;
                        if (calls === 1) throw new Error("storage unavailable");
                        await Bun.sleep(20);
                        delayedUploadFinished = true;
                    },
                    remove_prefix: async () => {
                        cleanupStartedAfterBatch = delayedUploadFinished;
                    },
                },
            ),
        ).rejects.toThrow("storage unavailable");
        expect(cleanupStartedAfterBatch).toBe(true);
    } finally {
        fixture.dispose();
    }
});

test("rejects content-addressed files absent from their artifact manifest", async () => {
    const fixture = replay_archive({ extraUnreferencedResource: true });
    let uploads = 0;
    const sandbox = replay_archive_sandbox(fixture.archive);
    const manifest = replay_manifest();
    try {
        await expect(
            ProductDiffReplayArtifacts.upload(
                sandbox,
                "/home/user/output/replay",
                "product-diffs/project/product-diff",
                manifest,
                { info: () => undefined } as unknown as Logger,
                {
                    put: async () => {
                        uploads += 1;
                    },
                    remove_prefix: async () => undefined,
                },
            ),
        ).rejects.toThrow("unowned replay archive file");
        expect(uploads).toBe(0);
    } finally {
        fixture.dispose();
    }
});

test("rejects a replay object whose bytes do not match its content address", async () => {
    const fixture = replay_archive({ mismatchedResourceHash: true });
    let uploads = 0;
    const sandbox = replay_archive_sandbox(fixture.archive);
    const manifest = replay_manifest();
    try {
        await expect(
            ProductDiffReplayArtifacts.upload(
                sandbox,
                "/home/user/output/replay",
                "product-diffs/project/product-diff",
                manifest,
                { info: () => undefined } as unknown as Logger,
                {
                    put: async () => {
                        uploads += 1;
                    },
                    remove_prefix: async () => undefined,
                },
            ),
        ).rejects.toThrow("content address");
        expect(uploads).toBe(0);
    } finally {
        fixture.dispose();
    }
});

test("rejects an archive missing the artifact package referenced by V4", async () => {
    const fixture = replay_archive();
    let uploads = 0;
    const sandbox = replay_archive_sandbox(fixture.archive);
    try {
        await expect(
            ProductDiffReplayArtifacts.upload(
                sandbox,
                "/home/user/output/replay",
                "product-diffs/project/product-diff",
                replay_manifest("replay/web/billing/default/desktop/head/artifact.json"),
                { info: () => undefined } as unknown as Logger,
                {
                    put: async () => {
                        uploads += 1;
                    },
                    remove_prefix: async () => undefined,
                },
            ),
        ).rejects.toThrow("referenced replay artifact is missing");
        expect(uploads).toBe(0);
    } finally {
        fixture.dispose();
    }
});

test("rejects an artifact package not owned by the V4 manifest", async () => {
    const fixture = replay_archive({ extraArtifact: true });
    let uploads = 0;
    const sandbox = replay_archive_sandbox(fixture.archive);
    try {
        await expect(
            ProductDiffReplayArtifacts.upload(
                sandbox,
                "/home/user/output/replay",
                "product-diffs/project/product-diff",
                replay_manifest(),
                { info: () => undefined } as unknown as Logger,
                {
                    put: async () => {
                        uploads += 1;
                    },
                    remove_prefix: async () => undefined,
                },
            ),
        ).rejects.toThrow("unowned replay archive file");
        expect(uploads).toBe(0);
    } finally {
        fixture.dispose();
    }
});

test("rejects hard-linked tar entries before uploading", async () => {
    const fixture = replay_archive({ hardLinkedArtifact: true });
    let uploads = 0;
    const sandbox = replay_archive_sandbox(fixture.archive);
    try {
        await expect(
            ProductDiffReplayArtifacts.upload(
                sandbox,
                "/home/user/output/replay",
                "product-diffs/project/product-diff",
                replay_manifest(),
                { info: () => undefined } as unknown as Logger,
                {
                    put: async () => {
                        uploads += 1;
                    },
                    remove_prefix: async () => undefined,
                },
            ),
        ).rejects.toThrow("unsupported replay archive entry type");
        expect(uploads).toBe(0);
    } finally {
        fixture.dispose();
    }
});

test("rejects an oversized sandbox archive before transferring its bytes", async () => {
    let readCalled = false;
    const sandbox = {
        commands: { run: async () => ({ exitCode: 0, stdout: "", stderr: "" }) },
        files: {
            getInfo: async () => ({ size: 100_000_001, type: "file" }),
            read: async () => {
                readCalled = true;
                throw new Error("archive bytes were transferred");
            },
        },
    } as unknown as Sandbox;

    await expect(
        ProductDiffReplayArtifacts.upload(
            sandbox,
            "/home/user/output/replay",
            "product-diffs/project/product-diff",
            replay_manifest(),
            { info: () => undefined } as unknown as Logger,
            {
                put: async () => undefined,
                remove_prefix: async () => undefined,
            },
        ),
    ).rejects.toThrow("compressed size limit");
    expect(readCalled).toBe(false);
});
