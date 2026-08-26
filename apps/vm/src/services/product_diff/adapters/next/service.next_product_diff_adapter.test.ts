import type Logger from "@trymatcha/logger";
import { afterEach, expect, mock, test } from "bun:test";
import type { Sandbox } from "e2b";

import PreviewRunner from "../../../service.preview_runner";
import PreviewServer from "../../../service.preview_server";
import PreviewWorkspace from "../../../service.preview_workspace";
import type { ProductDiffWorkspacePlan } from "../../adapter.contract";
import type { ProductDiffAdapterRuntime } from "../../adapter.registry";
import NextPreviewLauncher from "./service.next_preview_launcher";
import NextPreviewSurface from "./service.next_preview_surface";
import NextProductDiffAdapter from "./service.next_product_diff_adapter";

const originalInspect = PreviewRunner.inspect_next_workspace;
const originalDetect = PreviewRunner.detect;
const originalWritePlaceholderEnv = PreviewWorkspace.write_placeholder_env;
const originalDisableMiddleware = PreviewWorkspace.disable_middleware;
const originalCreateSurface = NextPreviewSurface.create;
const originalRemoveSurface = NextPreviewSurface.remove;
const originalStart = PreviewServer.start;
const originalWaitUntilReady = PreviewServer.wait_until_ready;
const originalStop = PreviewServer.stop;

const runtime: ProductDiffAdapterRuntime = {
    sandbox: {} as Sandbox,
    projectId: "project-id",
    log: {} as Logger,
    environment: {},
};

const workspacePlan: ProductDiffWorkspacePlan = {
    repositoryRoot: ".",
    applicationPath: "apps/marketing",
    workspaceKind: "Turborepo",
    installDirectory: ".",
    launchCommand: "pnpm --filter @acme/marketing run dev",
    healthPath: "/",
    router: "AppRouter",
    framework: "NextAppRouter",
    rootLayoutMode: null,
    dependency: {
        packageManager: "pnpm",
        lockfileRelPath: "pnpm-lock.yaml",
        lockfileSha256: "lock-hash",
        workspaceDirs: ["."],
    },
};

function next_detect(applicationPath: string) {
    return {
        supported: true,
        reason: null,
        framework: "NextAppRouter" as const,
        nextAppDir: applicationPath,
        routeDir: `${applicationPath}/app`,
        pagesDir: null,
        hasExistingPagesDir: false,
        packageManager: "pnpm" as const,
        lockfileRelPath: "pnpm-lock.yaml",
        lockfileSha256: "lock-hash",
        nextMajor: 16,
        globalStylesheet: null,
        middlewarePaths: [],
        envExampleKeys: [],
        workspaceDirs: ["."],
        warnings: [],
    };
}

test("requires configuration when legacy detection selects a different application", async () => {
    PreviewRunner.inspect_next_workspace = mock().mockResolvedValue({
        workspaceKind: "Turborepo",
        packageManager: "pnpm",
        applications: [
            {
                applicationPath: "apps/marketing",
                packageName: "@acme/marketing",
                router: "AppRouter",
                hasPagesDirectory: false,
            },
            {
                applicationPath: "apps/dashboard",
                packageName: "@acme/dashboard",
                router: "AppRouter",
                hasPagesDirectory: false,
            },
        ],
        changedApplicationPaths: ["apps/dashboard"],
    });
    PreviewRunner.detect = mock().mockResolvedValue(next_detect("apps/dashboard"));
    const adapter = new NextProductDiffAdapter(runtime);
    const detection = await adapter.detect({
        workspaceRoot: "/workspace/head",
        changedPaths: ["apps/dashboard/app/page.tsx"],
        configuration: { applicationPath: "apps/marketing" },
    });

    const resolution = await adapter.resolve_workspace({
        workspaceRoot: "/workspace/head",
        changedPaths: ["apps/dashboard/app/page.tsx"],
        configuration: { applicationPath: "apps/marketing" },
        detection,
    });

    expect(resolution).toMatchObject({
        plan: null,
        diagnostics: [expect.objectContaining({ code: "NEXT_APPLICATION_SELECTION_MISMATCH" })],
    });
    expect(PreviewRunner.detect).toHaveBeenCalledWith(runtime.sandbox, "/workspace/head", [
        "apps/marketing/package.json",
    ]);
});

test("resolves and enriches every changed replay application", async () => {
    PreviewRunner.inspect_next_workspace = mock().mockResolvedValue({
        workspaceKind: "Turborepo",
        packageManager: "pnpm",
        applications: [
            {
                applicationPath: "apps/marketing",
                packageName: "@acme/marketing",
                router: "AppRouter",
                hasPagesDirectory: false,
            },
            {
                applicationPath: "apps/admin",
                packageName: "@acme/admin",
                router: "PagesRouter",
                hasPagesDirectory: true,
            },
        ],
        changedApplicationPaths: ["apps/marketing", "apps/admin"],
    });
    PreviewRunner.detect = mock((_sandbox, _root, changedPaths: string[]) => {
        const applicationPath = changedPaths[0]!.split("/package.json")[0]!;
        return Promise.resolve({
            ...next_detect(applicationPath),
            framework:
                applicationPath === "apps/admin"
                    ? ("NextPagesRouter" as const)
                    : ("NextAppRouter" as const),
        });
    });
    const adapter = new NextProductDiffAdapter(runtime);
    const detection = await adapter.detect({
        workspaceRoot: "/workspace/head",
        changedPaths: ["apps/marketing/app/page.tsx", "apps/admin/pages/index.tsx"],
    });

    const resolution = await adapter.resolve_replay_workspaces!({
        workspaceRoot: "/workspace/head",
        changedPaths: ["apps/marketing/app/page.tsx", "apps/admin/pages/index.tsx"],
        detection,
    });

    expect(resolution).toMatchObject({
        diagnostics: [],
        plans: [
            { applicationPath: "apps/admin", framework: "NextPagesRouter" },
            { applicationPath: "apps/marketing", framework: "NextAppRouter" },
        ],
    });
});

test("detects an Nx project through project.json instead of an app package manifest", async () => {
    PreviewRunner.inspect_next_workspace = mock().mockResolvedValue({
        workspaceKind: "Nx",
        packageManager: "bun",
        applications: [
            {
                applicationPath: "apps/admin",
                packageName: "admin",
                router: "AppRouter",
                hasPagesDirectory: false,
                nxTargets: {
                    build: "admin:build:production",
                    serve: "admin:serve:production",
                },
            },
        ],
        changedApplicationPaths: ["apps/admin"],
    });
    const detect = mock().mockResolvedValue({
        ...next_detect("apps/admin"),
        packageManager: "bun" as const,
        lockfileRelPath: "bun.lock",
    });
    PreviewRunner.detect = detect;
    const adapter = new NextProductDiffAdapter(runtime);
    const detection = await adapter.detect({
        workspaceRoot: "/workspace/head",
        changedPaths: ["apps/admin/app/page.tsx"],
    });

    const resolution = await adapter.resolve_workspace({
        workspaceRoot: "/workspace/head",
        changedPaths: ["apps/admin/app/page.tsx"],
        detection,
    });

    expect(resolution.plan).toMatchObject({
        applicationPath: "apps/admin",
        nxTargets: {
            build: "admin:build:production",
            serve: "admin:serve:production",
        },
    });
    expect(detect).toHaveBeenCalledWith(runtime.sandbox, "/workspace/head", [
        "apps/admin/project.json",
    ]);
});

test("uses the selected application path while preparing the base revision", async () => {
    const detect = mock().mockResolvedValue(next_detect("apps/marketing"));
    PreviewRunner.detect = detect;
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    const adapter = new NextProductDiffAdapter(runtime);

    await adapter.prepare_revision({
        revision: "base",
        workspaceRoot: "/workspace/base",
        plan: workspacePlan,
    });

    expect(detect).toHaveBeenCalledWith(runtime.sandbox, "/workspace/base", [
        "apps/marketing/package.json",
    ]);
});

test("launches the selected application with next start arguments owned by Next", () => {
    const plan = NextPreviewLauncher.from_workspace_plan({
        mode: "production",
        workspaceRoot: "/workspace/head",
        workspacePlan,
        port: 41337,
    });

    expect(plan.command).toBe(
        "pnpm --dir apps/marketing exec next start --hostname 127.0.0.1 --port 41337",
    );
    expect(plan.command).not.toContain("next start -- --hostname");
    expect(plan.workingDirectory).toBe("/workspace/head");
});

test("prepares replay revisions through a separate production build lifecycle", async () => {
    const run = mock().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });
    const replayRuntime = {
        ...runtime,
        sandbox: { commands: { run } } as unknown as Sandbox,
    };
    PreviewRunner.detect = mock().mockResolvedValue(next_detect("apps/marketing"));
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-replay-head",
        generatedFiles: [
            "/workspace/head/apps/marketing/app/preview-replay-head/[targetId]/page.tsx",
        ],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    const adapter = new NextProductDiffAdapter(replayRuntime);

    const prepared = await adapter.prepare_replay_revision({
        revision: "head",
        workspaceRoot: "/workspace/head",
        plan: workspacePlan,
        rootLayoutMode: "inherit",
    });

    expect(prepared).toMatchObject({
        revision: "head",
        workspaceRoot: "/workspace/head",
        applicationPath: "/workspace/head/apps/marketing",
    });
    expect(run).toHaveBeenCalledWith(
        "pnpm --dir apps/marketing run build",
        expect.objectContaining({ cwd: "/workspace/head" }),
    );
});

test("rejects a replay application path that traverses outside the workspace", async () => {
    const run = mock().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });
    const replayRuntime = {
        ...runtime,
        sandbox: { commands: { run } } as unknown as Sandbox,
    };
    const traversalPlan = { ...workspacePlan, applicationPath: "../outside" };
    PreviewRunner.detect = mock().mockResolvedValue(next_detect("../outside"));
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-replay-head",
        generatedFiles: [],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    const adapter = new NextProductDiffAdapter(replayRuntime);

    await expect(
        adapter.prepare_replay_revision({
            revision: "head",
            workspaceRoot: "/workspace/head",
            plan: traversalPlan,
            rootLayoutMode: "inherit",
        }),
    ).rejects.toThrow("inside the workspace root");
});

test("rejects an absolute replay application path", async () => {
    const run = mock().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });
    const replayRuntime = {
        ...runtime,
        sandbox: { commands: { run } } as unknown as Sandbox,
    };
    const absolutePlan = { ...workspacePlan, applicationPath: "/workspace/other" };
    PreviewRunner.detect = mock().mockResolvedValue(next_detect("/workspace/other"));
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-replay-head",
        generatedFiles: [],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    const adapter = new NextProductDiffAdapter(replayRuntime);

    await expect(
        adapter.prepare_replay_revision({
            revision: "head",
            workspaceRoot: "/workspace/head",
            plan: absolutePlan,
            rootLayoutMode: "inherit",
        }),
    ).rejects.toThrow("must be relative");
});

test("starts a prepared replay revision after it crosses the orchestration boundary", async () => {
    const run = mock(async (command: string) => ({
        exitCode: 0,
        stdout: command.startsWith("find -P")
            ? "/workspace/head/apps/marketing/.next/static/chunks/app.js\0"
            : "",
        stderr: "",
    }));
    const replayRuntime = {
        ...runtime,
        sandbox: { commands: { run } } as unknown as Sandbox,
    };
    PreviewRunner.detect = mock().mockResolvedValue(next_detect("apps/marketing"));
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-replay-head",
        generatedFiles: [
            "/workspace/head/apps/marketing/app/preview-replay-head/[targetId]/page.tsx",
        ],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    PreviewServer.start = mock().mockResolvedValue({
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/preview/replay.log",
        port: 41337,
        process: {},
    });
    PreviewServer.wait_until_ready = mock().mockResolvedValue(true);
    const adapter = new NextProductDiffAdapter(replayRuntime);
    const prepared = await adapter.prepare_replay_revision({
        revision: "head",
        workspaceRoot: "/workspace/head",
        plan: workspacePlan,
        rootLayoutMode: "inherit",
    });

    const replay = await adapter.start_replay_revision({
        revision: "head",
        workspaceRoot: "/workspace/head",
        plan: workspacePlan,
        preparedRevision: { ...prepared },
        port: 41337,
    });

    expect(replay).toEqual({
        id: "replay-head-41337",
        revision: "head",
        url: "http://127.0.0.1:41337",
        surfacePath: "/preview-replay-head",
        applicationPath: "/workspace/head/apps/marketing",
        browserAssets: [
            {
                requestPath: "/_next/static/chunks/app.js",
                sourcePath: "/workspace/head/apps/marketing/.next/static/chunks/app.js",
                contentType: "application/javascript",
            },
        ],
    });
});

test("rejects a production start plan that does not match the prepared application", async () => {
    const run = mock().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });
    const replayRuntime = {
        ...runtime,
        sandbox: { commands: { run } } as unknown as Sandbox,
    };
    PreviewRunner.detect = mock().mockResolvedValue(next_detect("apps/marketing"));
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-replay-head",
        generatedFiles: [],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    PreviewServer.start = mock().mockResolvedValue({
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/preview/replay.log",
        port: 41337,
        process: {},
    });
    PreviewServer.wait_until_ready = mock().mockResolvedValue(true);
    const adapter = new NextProductDiffAdapter(replayRuntime);
    const prepared = await adapter.prepare_replay_revision({
        revision: "head",
        workspaceRoot: "/workspace/head",
        plan: workspacePlan,
        rootLayoutMode: "inherit",
    });

    await expect(
        adapter.start_replay_revision({
            revision: "head",
            workspaceRoot: "/workspace/head",
            plan: { ...workspacePlan, applicationPath: "apps/dashboard" },
            preparedRevision: prepared,
            port: 41337,
        }),
    ).rejects.toThrow("must match the prepared application");
});

test("clears failed replay startup state after sequential cleanup", async () => {
    const run = mock().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });
    const replayRuntime = {
        ...runtime,
        sandbox: { commands: { run } } as unknown as Sandbox,
    };
    PreviewRunner.detect = mock().mockResolvedValue(next_detect("apps/marketing"));
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-replay-head",
        generatedFiles: [
            "/workspace/head/apps/marketing/app/preview-replay-head/[targetId]/page.tsx",
        ],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    PreviewServer.start = mock().mockResolvedValue({
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/preview/replay.log",
        port: 41337,
        process: {},
    });
    PreviewServer.wait_until_ready = mock().mockResolvedValue(false);
    PreviewServer.stop = mock().mockResolvedValue(undefined);
    NextPreviewSurface.remove = mock().mockResolvedValue(undefined);
    const adapter = new NextProductDiffAdapter(replayRuntime);
    const prepared = await adapter.prepare_replay_revision({
        revision: "head",
        workspaceRoot: "/workspace/head",
        plan: workspacePlan,
        rootLayoutMode: "inherit",
    });
    await expect(
        adapter.start_replay_revision({
            revision: "head",
            workspaceRoot: "/workspace/head",
            plan: workspacePlan,
            preparedRevision: prepared,
            port: 41337,
        }),
    ).rejects.toThrow("Next replay production server did not become ready");

    await adapter.cleanup_replay_revision({
        revision: "head",
        workspaceRoot: "/workspace/head",
        preparedRevision: prepared,
        preview: null,
    });
    await adapter.cleanup_replay_revision({
        revision: "head",
        workspaceRoot: "/workspace/head",
        preparedRevision: null,
        preview: {
            id: "replay-head-41337",
            revision: "head",
            url: "http://127.0.0.1:41337",
            surfacePath: "/preview-replay-head",
            applicationPath: "/workspace/head/apps/marketing",
            browserAssets: [],
        },
    });

    expect(PreviewServer.stop).toHaveBeenCalledTimes(1);
    expect(NextPreviewSurface.remove).toHaveBeenCalledTimes(1);
});

test("retries only unfinished replay cleanup after a server stop failure", async () => {
    const run = mock().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });
    const replayRuntime = {
        ...runtime,
        sandbox: { commands: { run } } as unknown as Sandbox,
    };
    PreviewRunner.detect = mock().mockResolvedValue(next_detect("apps/marketing"));
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-replay-head",
        generatedFiles: [],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    PreviewServer.start = mock().mockResolvedValue({
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/preview/replay.log",
        port: 41337,
        process: {},
    });
    PreviewServer.wait_until_ready = mock().mockResolvedValue(true);
    PreviewServer.stop = mock()
        .mockRejectedValueOnce(new Error("stop failed"))
        .mockResolvedValue(undefined);
    NextPreviewSurface.remove = mock().mockResolvedValue(undefined);
    const adapter = new NextProductDiffAdapter(replayRuntime);
    const prepared = await adapter.prepare_replay_revision({
        revision: "head",
        workspaceRoot: "/workspace/head",
        plan: workspacePlan,
        rootLayoutMode: "inherit",
    });
    const replay = await adapter.start_replay_revision({
        revision: "head",
        workspaceRoot: "/workspace/head",
        plan: workspacePlan,
        preparedRevision: prepared,
        port: 41337,
    });
    const cleanup = {
        revision: "head" as const,
        workspaceRoot: "/workspace/head",
        preparedRevision: prepared,
        preview: replay,
    };

    await expect(adapter.cleanup_replay_revision(cleanup)).rejects.toThrow("stop failed");
    await expect(adapter.cleanup_replay_revision(cleanup)).resolves.toBeUndefined();

    expect(PreviewServer.stop).toHaveBeenCalledTimes(2);
    expect(NextPreviewSurface.remove).toHaveBeenCalledTimes(1);
});

afterEach(() => {
    PreviewRunner.inspect_next_workspace = originalInspect;
    PreviewRunner.detect = originalDetect;
    PreviewWorkspace.write_placeholder_env = originalWritePlaceholderEnv;
    PreviewWorkspace.disable_middleware = originalDisableMiddleware;
    NextPreviewSurface.create = originalCreateSurface;
    NextPreviewSurface.remove = originalRemoveSurface;
    PreviewServer.start = originalStart;
    PreviewServer.wait_until_ready = originalWaitUntilReady;
    PreviewServer.stop = originalStop;
});
