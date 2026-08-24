import { afterEach, expect, mock, test } from "bun:test";
import type Logger from "@trymatcha/logger";
import type { Sandbox } from "e2b";

import type { ProductDiffWorkspacePlan } from "./adapter.contract";
import NextPreviewLauncher from "./adapters/next/service.next_preview_launcher";
import NextPreviewSurface from "./adapters/next/service.next_preview_surface";
import PreviewRunner from "../service.preview_runner";
import PreviewServer from "../service.preview_server";
import ProductDiffPreviewLifecycle from "./service.preview_lifecycle";

const workspacePlan: ProductDiffWorkspacePlan = {
    repositoryRoot: ".",
    applicationPath: "apps/web",
    workspaceKind: "Standalone",
    installDirectory: ".",
    launchCommand: "bun run dev",
    healthPath: "/",
    router: "AppRouter",
};
const originalStart = PreviewServer.start;
const originalWaitUntilReady = PreviewServer.wait_until_ready;
const originalCreateSurface = NextPreviewSurface.create;
const originalCheck = PreviewRunner.check;
const originalCapture = PreviewRunner.capture;

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
        process: {},
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
                detail: "target failure",
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
        diagnostic: { code: "PREVIEW_BROWSER_VALIDATION_FAILED", stage: "browser-validation" },
    });
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

afterEach(() => {
    PreviewServer.start = originalStart;
    PreviewServer.wait_until_ready = originalWaitUntilReady;
    NextPreviewSurface.create = originalCreateSurface;
    PreviewRunner.check = originalCheck;
    PreviewRunner.capture = originalCapture;
});
