import { afterEach, expect, mock, test } from "bun:test";
import type Logger from "@trymatcha/logger";
import type { Sandbox } from "e2b";

import type { ProductDiffWorkspacePlan } from "./adapter.contract";
import NextPreviewLauncher from "./adapters/next/service.next_preview_launcher";
import NextPreviewSurface from "./adapters/next/service.next_preview_surface";
import PreviewRunner from "../service.preview_runner";
import PreviewServer, { type PreviewServerHandle } from "../service.preview_server";
import ProductDiffPreviewLifecycle from "./service.preview_lifecycle";

const workspacePlan: ProductDiffWorkspacePlan = {
    repositoryRoot: ".",
    applicationPath: "apps/web",
    workspaceKind: "Standalone",
    installDirectory: ".",
    launchCommand: "bun run dev",
    healthPath: "/",
    router: "AppRouter",
    framework: "NextAppRouter",
    dependency: {
        packageManager: "bun",
        lockfileRelPath: "bun.lock",
        lockfileSha256: "lock-hash",
        workspaceDirs: ["."],
    },
};
const originalStart = PreviewServer.start;
const originalWaitUntilReady = PreviewServer.wait_until_ready;
const originalLogTail = PreviewServer.log_tail;
const originalStartupDiagnostics = PreviewServer.startup_diagnostics;
const originalCreateSurface = NextPreviewSurface.create;
const originalCheck = PreviewRunner.check;
const originalCapture = PreviewRunner.capture;
const originalStop = PreviewServer.stop;
const originalRemoveSurface = NextPreviewSurface.remove;

test("refuses capture after browser validation fails", async () => {
    const sandbox = {} as Sandbox;
    const launchPlan = NextPreviewLauncher.create({
        workspaceKind: "Standalone",
        packageManager: "bun",
        applicationPath: "apps/web",
        port: 41337,
        workspaceRoot: "/workspace",
    });
    PreviewServer.start = mock().mockResolvedValue({
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/preview/server.log",
        port: 41337,
        process: {} as PreviewServerHandle["process"],
    });
    PreviewServer.wait_until_ready = mock().mockResolvedValue(true);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-run-a",
        generatedFiles: ["/workspace/apps/web/app/preview-run-a/[targetId]/page.tsx"],
        router: "AppRouter",
    });
    PreviewRunner.check = mock().mockResolvedValue({
        ok: false,
        results: [
            {
                targetId: "failing-target",
                stateId: "default",
                url: "http://127.0.0.1:41337/preview-run-a/failing-target",
                ok: false,
                httpStatus: 200,
                problem: "ConsoleError",
                detail: '{"Authorization":"Bearer lifecycle-secret","Cookie":"session=lifecycle-cookie"}\u001eaccess_token=lifecycle-control-secret',
            },
        ],
        warnings: [],
    });
    const capture = mock(PreviewRunner.capture).mockResolvedValue({
        ok: true,
        side: "head",
        captures: [],
        warnings: [],
    });
    PreviewRunner.capture = capture;

    const preview = await ProductDiffPreviewLifecycle.start_and_verify({
        sandbox,
        log: {} as Logger,
        revision: "head",
        workspaceRoot: "/workspace",
        workspacePlan,
        launchPlan,
        runId: "run-a",
    });

    expect(preview.health).toMatchObject({
        ok: false,
        diagnostic: {
            code: "PREVIEW_BROWSER_VALIDATION_FAILED",
            stage: "browser-validation",
            message:
                "preview browser validation failed; revision=head; target=failing-target; state=default; problem=ConsoleError; httpStatus=200; route=/preview-run-a",
        },
    });
    expect(preview.health.diagnostic?.message).not.toContain("lifecycle-secret");
    expect(preview.health.diagnostic?.message).not.toContain("lifecycle-cookie");
    expect(preview.health.diagnostic?.message).not.toContain("lifecycle-control-secret");
    await expect(
        ProductDiffPreviewLifecycle.capture_verified(sandbox, preview, {
            url: "http://127.0.0.1:41337",
            routePath: "/preview-run-a",
            side: "head",
            workspaceRoot: "/workspace",
            nextAppDir: "apps/web",
            outputDir: "/output",
            viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
            frozenNowMs: 1,
            maxShots: 1,
        }),
    ).rejects.toThrow("preview browser validation failed");
    expect(capture).not.toHaveBeenCalled();
});

test("logs a redacted startup summary without persisting server output", async () => {
    const sandbox = {} as Sandbox;
    const launchPlan = NextPreviewLauncher.create({
        workspaceKind: "Standalone",
        packageManager: "bun",
        applicationPath: "apps/web",
        port: 41337,
        workspaceRoot: "/workspace",
    });
    PreviewServer.start = mock().mockResolvedValue({
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/preview/server.log",
        port: 41337,
        process: {},
    });
    PreviewServer.wait_until_ready = mock().mockResolvedValue(false);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-run-a",
        generatedFiles: ["/workspace/apps/web/app/preview-run-a/[targetId]/page.tsx"],
        router: "AppRouter",
    });
    PreviewServer.startup_diagnostics = mock().mockResolvedValue({
        logTail: "Module not found: Can't resolve 'pino-pretty' Authorization=Bearer lifecycle-log-secret",
        listenerSnapshot: "",
        processSnapshot: "123 S 241 next dev",
    });
    const log = { warn: mock() } as unknown as Logger;

    const preview = await ProductDiffPreviewLifecycle.start_and_verify({
        sandbox,
        log,
        revision: "head",
        workspaceRoot: "/workspace",
        workspacePlan,
        launchPlan,
        runId: "run-a",
    });

    expect(preview.health).toEqual({
        ok: false,
        diagnostic: {
            code: "PREVIEW_SERVER_UNAVAILABLE",
            stage: "startup",
            message: "The preview server did not become ready.",
            adapter: "next",
            applicationPath: "apps/web",
            workspaceKind: "Standalone",
        },
    });
    expect(JSON.stringify(preview.health)).not.toContain("lifecycle-log-secret");
    expect(PreviewServer.startup_diagnostics).toHaveBeenCalled();
    expect(PreviewServer.wait_until_ready).toHaveBeenCalledWith(
        sandbox,
        expect.anything(),
        log,
        "/preview-run-a/__ready__",
    );
    expect(log.warn).toHaveBeenCalledWith(
        "preview startup failed",
        expect.objectContaining({
            revision: "head",
            applicationPath: "apps/web",
            startupSummary: "Module not found: Can't resolve 'pino-pretty' Authorization=[redacted]",
            processSnapshot: "123 S 241 next dev",
        }),
    );
});

test("does not persist preview surface errors", async () => {
    const sandbox = {} as Sandbox;
    const launchPlan = NextPreviewLauncher.create({
        workspaceKind: "Standalone",
        packageManager: "bun",
        applicationPath: "apps/web",
        port: 41337,
        workspaceRoot: "/workspace",
    });
    PreviewServer.start = mock().mockResolvedValue({
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/preview/server.log",
        port: 41337,
        process: {},
    });
    PreviewServer.wait_until_ready = mock().mockResolvedValue(true);
    NextPreviewSurface.create = mock().mockRejectedValue(
        new Error("PREVIEW_TOKEN=lifecycle-surface-secret"),
    );

    const preview = await ProductDiffPreviewLifecycle.start_and_verify({
        sandbox,
        log: {} as Logger,
        revision: "base",
        workspaceRoot: "/workspace",
        workspacePlan,
        launchPlan,
        runId: "run-a",
    });

    expect(preview.health).toEqual({
        ok: false,
        diagnostic: {
            code: "PREVIEW_SURFACE_UNAVAILABLE",
            stage: "preview-surface",
            message: "The preview surface could not be prepared.",
            adapter: "next",
            applicationPath: "apps/web",
            workspaceKind: "Standalone",
        },
    });
    expect(JSON.stringify(preview.health)).not.toContain("lifecycle-surface-secret");
});

test("removes the preview surface when stopping the server fails", async () => {
    const server = {
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/preview/server.log",
        port: 41337,
        process: {} as PreviewServerHandle["process"],
    };
    const surface = {
        routePath: "/preview-run-a",
        generatedFiles: ["/workspace/apps/web/app/preview-run-a/[targetId]/page.tsx"],
        router: "AppRouter" as const,
    };
    PreviewServer.stop = mock().mockRejectedValue(new Error("stop failed"));
    NextPreviewSurface.remove = mock().mockResolvedValue(undefined);

    await expect(
        ProductDiffPreviewLifecycle.cleanup_revision({} as Sandbox, {
            revision: "head",
            server,
            surface,
            health: { ok: false, diagnostic: null },
        }),
    ).rejects.toThrow("stop failed");

    expect(NextPreviewSurface.remove).toHaveBeenCalledWith({}, surface);
});

afterEach(() => {
    PreviewServer.start = originalStart;
    PreviewServer.wait_until_ready = originalWaitUntilReady;
    PreviewServer.log_tail = originalLogTail;
    PreviewServer.startup_diagnostics = originalStartupDiagnostics;
    NextPreviewSurface.create = originalCreateSurface;
    PreviewRunner.check = originalCheck;
    PreviewRunner.capture = originalCapture;
    PreviewServer.stop = originalStop;
    NextPreviewSurface.remove = originalRemoveSurface;
});
