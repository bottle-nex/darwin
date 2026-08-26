import Logger from "@trymatcha/logger";
import { expect, test } from "bun:test";
import type { Sandbox } from "e2b";

import PreviewRunner from "./service.preview_runner";

function sandbox_with_runtime_version(version: number): Sandbox {
    return {
        commands: {
            run: async () => ({
                exitCode: 0,
                stdout: JSON.stringify({ version }),
            }),
        },
    } as unknown as Sandbox;
}

test("accepts the current preview-runner protocol and rejects an older snapshot", async () => {
    expect(await PreviewRunner.supports_current_protocol(sandbox_with_runtime_version(11))).toBe(
        true,
    );
    expect(await PreviewRunner.supports_current_protocol(sandbox_with_runtime_version(10))).toBe(
        false,
    );
});

test("sends a VM-provided job-scoped surface request to the sandbox runner", async () => {
    let request: unknown = null;
    let command = "";
    const sandbox = {
        files: {
            write: async (_path: string, contents: string) => {
                request = JSON.parse(contents);
            },
            read: async () =>
                JSON.stringify({
                    routePath: "/preview-run-a",
                    generatedFiles: ["/workspace/apps/web/app/preview-run-a/[targetId]/page.tsx"],
                    router: "AppRouter",
                    rootLayoutMode: "isolate",
                    rootLayoutRestore: {
                        layoutPath: "/workspace/apps/web/app/layout.tsx",
                        backupPath:
                            "/workspace/apps/web/.matcha_preview_runtime/preview-run-a/layout.tsx",
                        generatedShellPath: "/workspace/apps/web/app/layout.tsx",
                    },
                }),
        },
        commands: {
            run: async (value: string) => {
                command = value;
                return { exitCode: 0, stdout: "" };
            },
        },
    } as unknown as Sandbox;

    const surface = await PreviewRunner.create_next_preview_surface(sandbox, {
        workspaceRoot: "/workspace",
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
        rootLayoutMode: "isolate",
    });

    expect(command).toContain("create-next-preview-surface");
    expect(request).toEqual({
        workspaceRoot: "/workspace",
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
        rootLayoutMode: "isolate",
    });
    expect(surface.routePath).toBe("/preview-run-a");
});

async function logged_failure(operation: () => Promise<unknown>): Promise<string> {
    const lines: string[] = [];
    const originalConsoleError = console.error;
    console.error = (...values: unknown[]) => {
        lines.push(values.map(String).join(" "));
    };
    try {
        try {
            await operation();
        } catch (error) {
            Logger.scope("preview-runner-test").error("runner failed", error);
        }
    } finally {
        console.error = originalConsoleError;
    }
    return lines.join("\n");
}

test("does not copy secret-bearing screenshot stderr into logs", async () => {
    const sandbox = {
        files: {
            write: async () => undefined,
        },
        commands: {
            run: async () => {
                throw Object.assign(
                    new Error("Command failed: Authorization=Bearer screenshot-error-secret"),
                    {
                        exitCode: 1,
                        stdout: "Cookie=session=screenshot-output-secret",
                        stderr: "Authorization=Bearer screenshot-error-secret",
                    },
                );
            },
        },
    } as unknown as Sandbox;

    const logs = await logged_failure(() =>
        PreviewRunner.capture(sandbox, {
            url: "http://127.0.0.1:41337",
            routePath: "/preview-run-head",
            side: "head",
            workspaceRoot: "/workspace",
            nextAppDir: "apps/web",
            outputDir: "/output",
            viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
            frozenNowMs: 1,
            maxShots: 1,
        }),
    );

    expect(logs).toContain("Preview runner command failed");
    expect(logs).not.toContain("screenshot-output-secret");
    expect(logs).not.toContain("screenshot-error-secret");
});

test("does not copy secret-bearing replay stderr into logs", async () => {
    const sandbox = {
        files: { write: async () => undefined },
        commands: {
            run: async () => {
                throw Object.assign(
                    new Error("Command failed: DATABASE_URL=postgres://replay-error-secret"),
                    {
                        exitCode: 1,
                        stdout: "Set-Cookie: replay-output-secret",
                        stderr: "DATABASE_URL=postgres://replay-error-secret",
                    },
                );
            },
        },
    } as unknown as Sandbox;

    const logs = await logged_failure(() =>
        PreviewRunner.replay_capture(sandbox, {
            url: "http://127.0.0.1:41337/billing",
            artifactRoot: "/output/replay/billing/default/desktop/head",
            scenario: { id: "billing-default", label: "Billing default", actions: [] },
            viewport: { width: 1280, height: 800 },
            browserAssets: [],
        }),
    );

    expect(logs).toContain("Preview runner command failed");
    expect(logs).not.toContain("replay-output-secret");
    expect(logs).not.toContain("replay-error-secret");
});

test("allows only the generated component state query during replay capture", async () => {
    let request: unknown = null;
    const sandbox = {
        files: {
            write: async (_path: string, contents: string) => {
                request = JSON.parse(contents);
            },
            read: async () =>
                JSON.stringify({
                    artifactKey: "artifact.json",
                    fidelity: "Verified",
                    diagnostics: [],
                    resourceCount: 8,
                    packageBytes: 4096,
                    captureDurationMs: 1250,
                    validationOutcome: "Verified",
                }),
        },
        commands: {
            run: async () => ({ exitCode: 0, stdout: "" }),
        },
    } as unknown as Sandbox;

    const result = await PreviewRunner.replay_capture(sandbox, {
        url: "http://127.0.0.1:41337/preview/provider-card?state=default&token=blocked",
        artifactRoot: "/output/replay/provider/default/desktop/head",
        scenario: { id: "provider-default", label: "Provider default", actions: [] },
        viewport: { width: 1280, height: 800 },
        browserAssets: [],
    });

    expect(request).toMatchObject({
        policy: { allowedQueryParameters: { state: ["default"] } },
    });
    expect(request).not.toMatchObject({
        policy: { allowedQueryParameters: { token: expect.anything() } },
    });
    expect(request).not.toMatchObject({
        policy: { sameOriginJsonPaths: expect.anything() },
    });
    expect(result).toMatchObject({
        resourceCount: 8,
        packageBytes: 4096,
        captureDurationMs: 1250,
        validationOutcome: "Verified",
    });
});

test("passes only the project-provided replay data policy to the sandbox runner", async () => {
    let request: unknown = null;
    const sandbox = {
        files: {
            write: async (_path: string, contents: string) => {
                request = JSON.parse(contents);
            },
            read: async () =>
                JSON.stringify({
                    artifactKey: "artifact.json",
                    fidelity: "Verified",
                    diagnostics: [],
                    resourceCount: 1,
                    packageBytes: 512,
                    captureDurationMs: 100,
                    validationOutcome: "Verified",
                }),
        },
        commands: { run: async () => ({ exitCode: 0, stdout: "", stderr: "" }) },
    } as unknown as Sandbox;

    await PreviewRunner.replay_capture(sandbox, {
        url: "http://127.0.0.1:41337/catalog?state=default",
        artifactRoot: "/output/replay/catalog/default/desktop/head",
        scenario: { id: "catalog-default", label: "Catalog default", actions: [] },
        viewport: { width: 1280, height: 800 },
        browserAssets: [],
        dataPolicy: { sameOriginJsonPaths: ["/api/catalog"] },
    });

    expect(request).toMatchObject({
        policy: {
            allowedQueryParameters: { state: ["default"] },
            sameOriginJsonPaths: ["/api/catalog"],
        },
    });
});

test("passes the requested settle time to the sandbox capture command", async () => {
    let request: unknown = null;
    const sandbox = {
        files: {
            write: async (_path: string, contents: string) => {
                request = JSON.parse(contents);
            },
            read: async () =>
                JSON.stringify({
                    ok: true,
                    side: "head",
                    captures: [],
                    warnings: [],
                }),
        },
        commands: {
            run: async () => ({ exitCode: 0, stdout: "" }),
        },
    } as unknown as Sandbox;

    await PreviewRunner.capture(sandbox, {
        url: "http://127.0.0.1:41337",
        routePath: "/preview-run-head",
        side: "head",
        workspaceRoot: "/workspace",
        nextAppDir: "apps/web",
        outputDir: "/output",
        viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
        frozenNowMs: 1,
        settleMs: 1_000,
        maxShots: 1,
    });

    expect(request).toMatchObject({ settleMs: 1_000 });
});

test("preserves the truncation sentinel when normalizing harness warnings", async () => {
    const sandbox = {
        files: {
            read: async () =>
                JSON.stringify({
                    targets: [
                        {
                            id: "header-nav",
                            label: "Header navigation",
                            sourcePath: "components/HeaderNav.tsx",
                            states: [{ id: "default", label: "Default" }],
                        },
                    ],
                    warnings: Array.from({ length: 21 }, (_, index) => `warning-${index}`),
                }),
        },
    } as unknown as Sandbox;

    const manifest = await PreviewRunner.read_manifest(sandbox, "/workspace/apps/web");

    expect(manifest.rootLayoutMode).toBeNull();
    expect(manifest.warnings).toHaveLength(20);
    expect(manifest.warnings.at(-1)).toBe("advisory warnings were truncated to fit preview limits");
    expect(manifest.warnings).toContain("warning-18");
    expect(manifest.warnings).not.toContain("warning-19");
});

function replay_plan() {
    return {
        applications: [{ id: "web", applicationPath: "apps/web" }],
        surfaces: [
            {
                id: "dashboard",
                applicationId: "web",
                label: "Dashboard",
                sourcePaths: ["app/dashboard/page.tsx"],
                entry: { kind: "route", path: "/dashboard" },
                rootLayoutMode: "inherit",
                states: [
                    {
                        id: "default",
                        label: "Default",
                        scenarios: [{ id: "ready", label: "Ready", actions: [] }],
                    },
                ],
                viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
            },
        ],
    };
}

function sandbox_with_replay_plan(plan: unknown): Sandbox {
    return {
        files: { read: async () => JSON.stringify(plan) },
    } as unknown as Sandbox;
}

test("reads duplicate surface coordinates only when their application identities differ", async () => {
    const plan = replay_plan();
    plan.applications.push({ id: "admin", applicationPath: "apps/admin" });
    plan.surfaces.push({
        ...structuredClone(plan.surfaces[0]!),
        applicationId: "admin",
    });

    const parsed = await PreviewRunner.read_replay_plan(
        sandbox_with_replay_plan(plan),
        "/workspace",
    );

    expect(parsed.surfaces.map((surface) => surface.applicationId)).toEqual(["web", "admin"]);
});

test("rejects duplicate identifiers at every replay coordinate scope", async () => {
    const duplicateApplication = replay_plan();
    duplicateApplication.applications.push({ id: "web", applicationPath: "apps/admin" });
    const duplicateSurface = replay_plan();
    duplicateSurface.surfaces.push(structuredClone(duplicateSurface.surfaces[0]!));
    const duplicateState = replay_plan();
    duplicateState.surfaces[0]!.states.push(
        structuredClone(duplicateState.surfaces[0]!.states[0]!),
    );
    const duplicateViewport = replay_plan();
    duplicateViewport.surfaces[0]!.viewports.push(
        structuredClone(duplicateViewport.surfaces[0]!.viewports[0]!),
    );
    const duplicateScenario = replay_plan();
    duplicateScenario.surfaces[0]!.states[0]!.scenarios.push(
        structuredClone(duplicateScenario.surfaces[0]!.states[0]!.scenarios[0]!),
    );

    for (const plan of [
        duplicateApplication,
        duplicateSurface,
        duplicateState,
        duplicateViewport,
        duplicateScenario,
    ]) {
        await expect(
            PreviewRunner.read_replay_plan(sandbox_with_replay_plan(plan), "/workspace"),
        ).rejects.toThrow();
    }
});
