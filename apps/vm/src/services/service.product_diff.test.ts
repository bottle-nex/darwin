import { Prisma, prisma } from "@trymatcha/database";
import type { ProductDiffManifestV4 } from "@trymatcha/types";
import { afterEach, expect, mock, test } from "bun:test";
import { Sandbox } from "e2b";

import { ENV } from "../conf/config.env";
import type { ProductDiffAdapter } from "./product_diff/adapter.contract";
import ProductDiffAdapterRegistry from "./product_diff/adapter.registry";
import NextPreviewSurface from "./product_diff/adapters/next/service.next_preview_surface";
import ClaudeRun from "./service.claude_run";
import GithubService from "./service.github";
import PreviewDeps from "./service.preview_deps";
import PreviewReplay from "./service.preview_replay";
import PreviewRunner from "./service.preview_runner";
import PreviewServer from "./service.preview_server";
import PreviewWorkspace from "./service.preview_workspace";
import {
    default as ProductDiffRunner,
    preview_check_error,
    preview_unavailable_diagnostic,
    preview_unavailable_error_message,
    product_diff_failure_status,
    replay_capture_observability,
    select_product_diff_mode,
} from "./service.product_diff";
import ProductDiffArtifacts from "./service.product_diff_artifacts";
import ProductDiffReplayArtifacts from "./service.product_diff_replay_artifacts";
import { run_product_diff_job } from "./services.queue";

const originalProductDiffUpdate = prisma.productDiff.updateMany;
const originalProductDiffFind = prisma.productDiff.findUniqueOrThrow;
const originalGitHubToken = GithubService.getInstallationToken;
const originalSandboxCreate = Sandbox.create;
const originalCheckout = PreviewWorkspace.checkout;
const originalChangedPaths = PreviewWorkspace.changed_paths;
const originalDetect = PreviewRunner.detect;
const originalInspectNextWorkspace = PreviewRunner.inspect_next_workspace;
const originalWritePlaceholderEnv = PreviewWorkspace.write_placeholder_env;
const originalDisableMiddleware = PreviewWorkspace.disable_middleware;
const originalRestoreUnexpectedEdits = PreviewWorkspace.restore_unexpected_edits;
const originalCopyHarness = PreviewWorkspace.copy_harness;
const originalCacheKey = PreviewDeps.cache_key;
const originalCachePresent = PreviewDeps.cache_present;
const originalRestoreInto = PreviewDeps.restore_into;
const originalClaudeExecute = ClaudeRun.execute;
const originalReadManifest = PreviewRunner.read_manifest;
const originalScaffold = PreviewRunner.scaffold;
const originalPreviewStart = PreviewServer.start;
const originalWaitUntilReady = PreviewServer.wait_until_ready;
const originalLogTail = PreviewServer.log_tail;
const originalRuntimeDiagnostics = PreviewServer.runtime_diagnostics;
const originalCapture = PreviewRunner.capture;
const originalPair = PreviewRunner.pair;
const originalCheck = PreviewRunner.check;
const originalCreateSurface = NextPreviewSurface.create;
const originalRemoveSurface = NextPreviewSurface.remove;
const originalStop = PreviewServer.stop;
const originalGetPullRequest = GithubService.getPullRequest;
const originalUpload = ProductDiffArtifacts.upload;
const originalRegisteredAdapters = ProductDiffAdapterRegistry.registered;
const originalReadReplayPlan = PreviewRunner.read_replay_plan;
const originalReplayCapture = PreviewReplay.capture;
const originalReplayValidate = PreviewReplay.validate;
const originalReplayUpload = ProductDiffReplayArtifacts.upload;
const originalProductDiffRun = ProductDiffRunner.run;
const replayEnvironment = ENV as typeof ENV & {
    SERVER_PRODUCT_DIFF_REPLAY_ENABLED: boolean;
    SERVER_PRODUCT_DIFF_REPLAY_ORIGIN?: string;
};
const originalReplayEnabled = replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED;
const originalReplayOrigin = replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN;

function enable_replay(): void {
    replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = true;
    replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = "http://replay.localhost:8080";
}

test("selects replay only for an enabled isolated replay origin", () => {
    expect(
        select_product_diff_mode({
            replayEnabled: true,
            replayOrigin: "https://replay.trymatchausercontent.app",
            applicationOrigins: ["https://app.trymatcha.app", "https://api.trymatcha.app"],
        }),
    ).toBe("replay");
    expect(
        select_product_diff_mode({
            replayEnabled: false,
            replayOrigin: "https://replay.trymatchausercontent.app",
            applicationOrigins: ["https://app.trymatcha.app"],
        }),
    ).toBe("screenshot");
    expect(
        select_product_diff_mode({
            replayEnabled: true,
            replayOrigin: undefined,
            applicationOrigins: ["https://app.trymatcha.app"],
        }),
    ).toBe("screenshot");
    expect(
        select_product_diff_mode({
            replayEnabled: true,
            replayOrigin: "https://replay.trymatcha.app",
            applicationOrigins: ["https://app.trymatcha.app"],
        }),
    ).toBe("screenshot");
    expect(
        select_product_diff_mode({
            replayEnabled: true,
            replayOrigin: "https://user:secret@replay.trymatchausercontent.app/path",
            applicationOrigins: ["https://app.trymatcha.app"],
        }),
    ).toBe("screenshot");
});

test("allows an HTTP replay origin only when every configured origin is local", () => {
    expect(
        select_product_diff_mode({
            replayEnabled: true,
            replayOrigin: "http://replay.localhost:8080",
            applicationOrigins: ["http://localhost:3000", "http://api.localhost:8080"],
        }),
    ).toBe("replay");
    expect(
        select_product_diff_mode({
            replayEnabled: true,
            replayOrigin: "http://replay.example.net",
            applicationOrigins: ["https://app.example.com"],
        }),
    ).toBe("screenshot");
});

test("requeues replay PreviewUnavailable Product Diffs while BullMQ attempts remain", async () => {
    enable_replay();
    ProductDiffRunner.run = mock().mockResolvedValue("PreviewUnavailable");
    prisma.productDiff.findUniqueOrThrow = mock().mockRejectedValue(
        new Error("queue retry must use the claimed run result"),
    );
    prisma.productDiff.updateMany = mock().mockResolvedValue({ count: 1 });

    await expect(
        run_product_diff_job({
            data: { productDiffId: "product-diff-id" },
            attemptsMade: 0,
            opts: { attempts: 3 },
        } as never),
    ).rejects.toThrow("Product Diff preview is unavailable and will be retried");
    expect(prisma.productDiff.updateMany).toHaveBeenCalledWith({
        where: { id: "product-diff-id", status: "PreviewUnavailable" },
        data: { status: "Pending", error: null, diagnostics: Prisma.JsonNull },
    });
    expect(prisma.productDiff.findUniqueOrThrow).not.toHaveBeenCalled();
});

test("leaves screenshot PreviewUnavailable Product Diffs terminal before the final attempt", async () => {
    replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = false;
    ProductDiffRunner.run = mock().mockResolvedValue("PreviewUnavailable");
    prisma.productDiff.updateMany = mock().mockResolvedValue({ count: 1 });

    await run_product_diff_job({
        data: { productDiffId: "product-diff-id" },
        attemptsMade: 0,
        opts: { attempts: 3 },
    } as never);

    expect(prisma.productDiff.updateMany).not.toHaveBeenCalled();
});

test("leaves PreviewUnavailable Product Diffs terminal after the final BullMQ attempt", async () => {
    enable_replay();
    ProductDiffRunner.run = mock().mockResolvedValue("PreviewUnavailable");
    prisma.productDiff.findUniqueOrThrow = mock().mockRejectedValue(
        new Error("queue retry must use the claimed run result"),
    );
    prisma.productDiff.updateMany = mock().mockResolvedValue({ count: 1 });

    await run_product_diff_job({
        data: { productDiffId: "product-diff-id" },
        attemptsMade: 2,
        opts: { attempts: 3 },
    } as never);

    expect(prisma.productDiff.updateMany).not.toHaveBeenCalled();
});

test("reports replay capture metrics without exposing diagnostic contents", () => {
    const fields = replay_capture_observability(
        {
            revision: "head",
            applicationId: "web",
            surfaceId: "rive-footer",
            stateId: "default",
            viewportId: "desktop",
            artifactKey: "replay/web/rive-footer/default/desktop/head/artifact.json",
            fidelity: "Partial",
            diagnostics: ["Authorization=Bearer should-never-be-logged"],
            resourceCount: 17,
            packageBytes: 65_536,
            captureDurationMs: 2400,
            validationOutcome: "Verified",
        },
        3,
    );

    expect(fields).toEqual({
        revision: "head",
        applicationId: "web",
        surfaceId: "rive-footer",
        stateId: "default",
        viewportId: "desktop",
        fidelity: "Partial",
        validationOutcome: "Verified",
        partialReason: "capture-runtime-differences",
        resourceCount: 17,
        packageBytes: 65_536,
        captureDurationMs: 2400,
        surfaceCount: 3,
    });
    expect(JSON.stringify(fields)).not.toContain("should-never-be-logged");
});

function product_diff_record() {
    return {
        id: "product-diff-id",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
        pullNumber: 42,
        issue: {
            project: {
                id: "project-id",
                githubRepoFullName: "acme/web",
                githubRepoId: 1,
                githubInstallation: { installationId: 2 },
                previewSnapshotId: null,
                previewDepsHash: null as string | null,
                projectConfig: { productDiffPreviewConfig: null },
            },
        },
    };
}

function mock_ready_preview_pipeline() {
    const update = mock().mockResolvedValue({ count: 1 });
    const productDiff = product_diff_record();
    productDiff.issue.project.previewDepsHash = "cache-key";
    prisma.productDiff.updateMany = update;
    prisma.productDiff.findUniqueOrThrow = mock().mockResolvedValue(productDiff);
    GithubService.getInstallationToken = mock().mockResolvedValue("github-token");
    Sandbox.create = mock().mockResolvedValue({
        sandboxId: "sandbox-id",
        commands: { run: mock().mockResolvedValue({}) },
        files: { write: mock().mockResolvedValue(undefined) },
        kill: mock().mockResolvedValue(undefined),
    });
    PreviewWorkspace.checkout = mock().mockResolvedValue(undefined);
    PreviewWorkspace.changed_paths = mock().mockResolvedValue(["apps/web/app/page.tsx"]);
    PreviewRunner.inspect_next_workspace = mock().mockResolvedValue({
        workspaceKind: "Standalone",
        packageManager: "bun",
        applications: [
            {
                applicationPath: "apps/web",
                packageName: null,
                router: "AppRouter",
                hasPagesDirectory: false,
            },
        ],
        changedApplicationPaths: ["apps/web"],
    });
    PreviewRunner.detect = mock().mockResolvedValue({
        supported: true,
        reason: null,
        framework: "NextAppRouter",
        nextAppDir: "apps/web",
        routeDir: "apps/web/app",
        pagesDir: null,
        hasExistingPagesDir: false,
        packageManager: "bun",
        lockfileRelPath: "bun.lock",
        lockfileSha256: "lock-hash",
        nextMajor: 16,
        globalStylesheet: null,
        middlewarePaths: [],
        envExampleKeys: [],
        workspaceDirs: ["."],
        warnings: [],
    });
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    PreviewWorkspace.restore_unexpected_edits = mock().mockResolvedValue([]);
    PreviewWorkspace.copy_harness = mock().mockResolvedValue(undefined);
    PreviewDeps.cache_key = mock().mockReturnValue("cache-key");
    PreviewDeps.cache_present = mock().mockResolvedValue(true);
    PreviewDeps.restore_into = mock().mockResolvedValue(undefined);
    ClaudeRun.execute = mock().mockResolvedValue(undefined);
    PreviewRunner.read_manifest = mock().mockResolvedValue({
        targets: [
            {
                id: "header",
                label: "Header",
                sourcePath: "components/Header.tsx",
                states: [{ id: "default", label: "Default" }],
            },
        ],
        warnings: [],
        rootLayoutMode: "inherit",
    });
    PreviewRunner.scaffold = mock().mockResolvedValue({
        ok: true,
        routeFiles: ["apps/web/matcha_preview/registry.ts"],
        warnings: [],
    });
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-run-head",
        generatedFiles: ["/workspace/apps/web/app/preview-run-head/[targetId]/page.tsx"],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    NextPreviewSurface.remove = mock().mockResolvedValue(undefined);
    PreviewServer.start = mock().mockResolvedValue({
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/home/user/preview/server.log",
        port: 41337,
        process: { kill: mock().mockResolvedValue(undefined) },
    });
    PreviewServer.wait_until_ready = mock().mockResolvedValue(true);
    PreviewServer.stop = mock().mockResolvedValue(undefined);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-run-a",
        generatedFiles: ["/workspace/apps/web/app/preview-run-a/[targetId]/page.tsx"],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    NextPreviewSurface.remove = mock().mockResolvedValue(undefined);
    PreviewRunner.check = mock().mockResolvedValue({ ok: true, results: [], warnings: [] });
    return update;
}

function successful_capture(
    side: "head" | "base",
): Awaited<ReturnType<typeof PreviewRunner.capture>> {
    return {
        ok: true,
        side,
        captures: [
            {
                targetId: "header",
                stateId: "default",
                viewportId: "desktop",
                status: "ok" as const,
                file: `header/default/desktop/${side}.png`,
                error: null,
            },
        ],
        warnings: [],
    };
}

function mock_preview_surface_creation() {
    const create = mock((...input: Parameters<typeof NextPreviewSurface.create>) =>
        Promise.resolve({
            routePath: "/preview-run-a",
            generatedFiles: ["/workspace/apps/web/app/preview-run-a/[targetId]/page.tsx"],
            router: "AppRouter" as const,
            rootLayoutMode: input[4],
            rootLayoutRestore: null,
        }),
    );
    NextPreviewSurface.create = create;
    return create;
}

function replay_plan() {
    return {
        applications: [{ id: "web", applicationPath: "apps/web", adapterId: "next" }],
        surfaces: [
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
}

test("builds captures stops validates and uploads replay revisions in exact sequence", async () => {
    const update = mock_ready_preview_pipeline();
    const events: string[] = [];
    const workspacePlan = {
        repositoryRoot: ".",
        applicationPath: "apps/web",
        workspaceKind: "Standalone",
        installDirectory: ".",
        launchCommand: "bun run dev",
        healthPath: "/",
        router: "AppRouter",
        framework: "NextAppRouter",
        rootLayoutMode: "inherit" as const,
        dependency: {
            packageManager: "bun" as const,
            lockfileRelPath: "bun.lock",
            lockfileSha256: "lock-hash",
            workspaceDirs: ["."],
        },
    };
    const adapter: ProductDiffAdapter = {
        id: "next",
        detect: mock().mockResolvedValue({ supported: true, diagnostics: [] }),
        resolve_workspace: mock().mockResolvedValue({ plan: workspacePlan, diagnostics: [] }),
        prepare_revision: mock(({ revision, workspaceRoot }) =>
            Promise.resolve({ revision, workspaceRoot, generatedPaths: [] }),
        ),
        start_revision: mock().mockRejectedValue(new Error("screenshot flow must stay disabled")),
        prepare_replay_revision: mock(({ revision, workspaceRoot }) => {
            events.push(`build:${revision}`);
            return Promise.resolve({
                revision,
                workspaceRoot,
                generatedPaths: [],
                applicationPath: `${workspaceRoot}/apps/web`,
                surfacePath: `/preview-replay-${revision}`,
            });
        }),
        start_replay_revision: mock(({ revision, port, preparedRevision }) =>
            Promise.resolve({
                id: `replay-${revision}`,
                revision,
                url: `http://127.0.0.1:${port}`,
                surfacePath: preparedRevision.surfacePath,
                applicationPath: preparedRevision.applicationPath,
                browserAssets: [],
            }),
        ),
        collect_replay_browser_assets: mock().mockResolvedValue([]),
        verify_revision: mock().mockRejectedValue(new Error("screenshot flow must stay disabled")),
        cleanup_revision: mock().mockResolvedValue(undefined),
        cleanup_replay_revision: mock(({ revision, preparedRevision, preview }) => {
            if (preparedRevision || preview) events.push(`stop:${revision}`);
            return Promise.resolve();
        }),
    };
    ProductDiffAdapterRegistry.registered = mock().mockReturnValue({
        resolve: mock().mockResolvedValue(adapter),
    });
    PreviewRunner.read_replay_plan = mock().mockResolvedValue(replay_plan());
    PreviewReplay.capture = mock((_sandbox, input) => {
        events.push(`capture:${input.revision}`);
        return Promise.resolve([
            {
                revision: input.revision,
                applicationId: "web",
                surfaceId: "footer",
                stateId: "default",
                viewportId: "desktop",
                artifactKey: `replay/web/footer/default/desktop/${input.revision}/artifact.json`,
                fidelity: "Verified" as const,
                diagnostics: [],
                resourceCount: 8,
                packageBytes: 4096,
                captureDurationMs: 1200,
                validationOutcome: "Verified" as const,
            },
        ]);
    });
    PreviewReplay.validate = mock((revision, captures) => {
        events.push(`validate:${revision}`);
        return captures;
    });
    ProductDiffReplayArtifacts.upload = mock().mockImplementation(() => {
        events.push("upload");
        return Promise.resolve(3);
    });
    GithubService.getPullRequest = mock().mockResolvedValue({
        state: "open",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
    });
    enable_replay();

    await ProductDiffRunner.run("product-diff-id");

    expect(events).toEqual([
        "build:head",
        "capture:head",
        "stop:head",
        "build:base",
        "capture:base",
        "stop:base",
        "validate:head",
        "validate:base",
        "upload",
    ]);
    expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({
                status: "Ready",
                manifest: expect.objectContaining({ version: 4 }),
            }),
        }),
    );
});

test("captures and publishes Base and Head for every declared Next application sequentially", async () => {
    const update = mock_ready_preview_pipeline();
    PreviewWorkspace.changed_paths = mock().mockResolvedValue([
        "apps/web/app/page.tsx",
        "apps/admin/app/page.tsx",
    ]);
    const plans = [
        {
            repositoryRoot: ".",
            applicationPath: "apps/web",
            workspaceKind: "Turborepo",
            installDirectory: ".",
            launchCommand: "bun run --cwd apps/web dev",
            healthPath: "/",
            router: "AppRouter",
            framework: "NextAppRouter",
            rootLayoutMode: "inherit" as const,
            dependency: {
                packageManager: "bun" as const,
                lockfileRelPath: "bun.lock",
                lockfileSha256: "lock-hash",
                workspaceDirs: ["."],
            },
        },
        {
            repositoryRoot: ".",
            applicationPath: "apps/admin",
            workspaceKind: "Turborepo",
            installDirectory: ".",
            launchCommand: "bun run --cwd apps/admin dev",
            healthPath: "/",
            router: "AppRouter",
            framework: "NextAppRouter",
            rootLayoutMode: "inherit" as const,
            dependency: {
                packageManager: "bun" as const,
                lockfileRelPath: "bun.lock",
                lockfileSha256: "lock-hash",
                workspaceDirs: ["."],
            },
        },
    ];
    const lifecycle: string[] = [];
    const adapter: ProductDiffAdapter = {
        id: "next",
        detect: mock().mockResolvedValue({ supported: true, diagnostics: [] }),
        resolve_workspace: mock().mockRejectedValue(
            new Error("single-application resolution must not run in replay mode"),
        ),
        resolve_replay_workspaces: mock().mockResolvedValue({ plans, diagnostics: [] }),
        prepare_revision: mock(({ revision, workspaceRoot, plan }) =>
            Promise.resolve({
                revision,
                workspaceRoot,
                generatedPaths: [`${plan.applicationPath}/matcha_preview/registry.ts`],
            }),
        ),
        start_revision: mock().mockRejectedValue(new Error("screenshot flow must stay disabled")),
        prepare_replay_revision: mock(({ revision, workspaceRoot, plan }) => {
            lifecycle.push(`build:${revision}:${plan.applicationPath}`);
            return Promise.resolve({
                revision,
                workspaceRoot,
                generatedPaths: [],
                applicationPath: `${workspaceRoot}/${plan.applicationPath}`,
                surfacePath: `/preview-${plan.applicationPath.replaceAll("/", "-")}-${revision}`,
            });
        }),
        start_replay_revision: mock(({ revision, port, preparedRevision }) =>
            Promise.resolve({
                id: `replay-${revision}-${preparedRevision.applicationPath}`,
                revision,
                url: `http://127.0.0.1:${port}`,
                surfacePath: preparedRevision.surfacePath,
                applicationPath: preparedRevision.applicationPath,
                browserAssets: [],
            }),
        ),
        collect_replay_browser_assets: mock().mockResolvedValue([]),
        verify_revision: mock().mockRejectedValue(new Error("screenshot flow must stay disabled")),
        cleanup_revision: mock().mockResolvedValue(undefined),
        cleanup_replay_revision: mock(({ revision, preparedRevision }) => {
            if (preparedRevision) {
                const applicationPath = preparedRevision.applicationPath
                    .split("/workspace/")
                    .at(-1)!;
                lifecycle.push(`stop:${revision}:${applicationPath.replace(/^(head|base)\//, "")}`);
            }
            return Promise.resolve();
        }),
    };
    ProductDiffAdapterRegistry.registered = mock().mockReturnValue({
        resolve: mock().mockResolvedValue(adapter),
    });
    PreviewRunner.read_replay_plan = mock().mockResolvedValue({
        applications: [
            { id: "web", applicationPath: "apps/web", adapterId: "next" },
            { id: "admin", applicationPath: "apps/admin", adapterId: "next" },
        ],
        surfaces: [
            {
                id: "web-home",
                applicationId: "web",
                label: "Web home",
                sourcePaths: ["app/page.tsx"],
                entry: { kind: "route", path: "/" as const },
                rootLayoutMode: "inherit" as const,
                states: [{ id: "default", label: "Default", scenarios: [] }],
                viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
            },
            {
                id: "admin-home",
                applicationId: "admin",
                label: "Admin home",
                sourcePaths: ["app/page.tsx"],
                entry: { kind: "route", path: "/" as const },
                rootLayoutMode: "inherit" as const,
                states: [{ id: "default", label: "Default", scenarios: [] }],
                viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
            },
        ],
    });
    PreviewReplay.capture = mock((_sandbox, input) => {
        const surface = input.plan.surfaces[0]!;
        lifecycle.push(`capture:${input.revision}:${surface.applicationId}`);
        return Promise.resolve([
            {
                revision: input.revision,
                applicationId: surface.applicationId,
                surfaceId: surface.id,
                stateId: "default",
                viewportId: "desktop",
                artifactKey: `replay/${surface.applicationId}/${surface.id}/default/desktop/${input.revision}/artifact.json`,
                fidelity: "Verified" as const,
                diagnostics: [],
                resourceCount: 2,
                packageBytes: 100,
                captureDurationMs: 10,
                validationOutcome: "Verified" as const,
            },
        ]);
    });
    PreviewReplay.validate = mock((_revision, captures) => captures);
    const upload = mock().mockResolvedValue(9);
    ProductDiffReplayArtifacts.upload = upload;
    GithubService.getPullRequest = mock().mockResolvedValue({
        state: "open",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
    });
    enable_replay();

    await ProductDiffRunner.run("product-diff-id");

    const settlement = update.mock.calls.at(-1)?.[0] as {
        data: { status: string; manifest: ProductDiffManifestV4 };
    };
    expect(settlement.data.status).toBe("Ready");
    expect(settlement.data.manifest.surfaces).toHaveLength(2);
    expect(upload).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ version: 4, surfaces: expect.any(Array) }),
        expect.anything(),
    );
    expect(PreviewWorkspace.copy_harness).toHaveBeenCalledWith(
        expect.anything(),
        "/home/user/workspace/head",
        "/home/user/workspace/base",
        ".",
    );
    expect(PreviewWorkspace.copy_harness).toHaveBeenCalledWith(
        expect.anything(),
        "/home/user/workspace/head",
        "/home/user/workspace/base",
        "apps/web",
    );
    expect(PreviewWorkspace.copy_harness).toHaveBeenCalledWith(
        expect.anything(),
        "/home/user/workspace/head",
        "/home/user/workspace/base",
        "apps/admin",
    );
    expect(
        settlement.data.manifest.surfaces.flatMap((surface) =>
            surface.states.flatMap((state) =>
                state.viewports.flatMap((viewport) => [
                    viewport.base.fidelity,
                    viewport.head.fidelity,
                ]),
            ),
        ),
    ).toEqual(["Verified", "Verified", "Verified", "Verified"]);
    expect(lifecycle).toEqual([
        "build:head:apps/web",
        "capture:head:web",
        "stop:head:apps/web",
        "build:head:apps/admin",
        "capture:head:admin",
        "stop:head:apps/admin",
        "build:base:apps/web",
        "capture:base:web",
        "stop:base:apps/web",
        "build:base:apps/admin",
        "capture:base:admin",
        "stop:base:apps/admin",
    ]);
});

test("publishes a verified Rive surface when an isolated provider surface is unavailable", async () => {
    const update = mock_ready_preview_pipeline();
    const events: string[] = [];
    const kill = mock(() => {
        events.push("sandbox-cleanup");
        return Promise.resolve();
    });
    Sandbox.create = mock().mockResolvedValue({
        sandboxId: "sandbox-id",
        commands: { run: mock().mockResolvedValue({}) },
        files: { write: mock().mockResolvedValue(undefined) },
        kill,
    });
    const workspacePlan = {
        repositoryRoot: ".",
        applicationPath: "apps/web",
        workspaceKind: "Turborepo",
        installDirectory: ".",
        launchCommand: "bun run dev",
        healthPath: "/",
        router: "AppRouter",
        framework: "NextAppRouter",
        rootLayoutMode: "inherit" as const,
        dependency: {
            packageManager: "bun" as const,
            lockfileRelPath: "bun.lock",
            lockfileSha256: "lock-hash",
            workspaceDirs: ["."],
        },
    };
    const adapter: ProductDiffAdapter = {
        id: "next",
        detect: mock().mockResolvedValue({ supported: true, diagnostics: [] }),
        resolve_workspace: mock().mockResolvedValue({ plan: workspacePlan, diagnostics: [] }),
        prepare_revision: mock(({ revision, workspaceRoot }) =>
            Promise.resolve({ revision, workspaceRoot, generatedPaths: [] }),
        ),
        start_revision: mock().mockRejectedValue(new Error("screenshot flow must stay disabled")),
        prepare_replay_revision: mock(({ revision, workspaceRoot }) =>
            Promise.resolve({
                revision,
                workspaceRoot,
                generatedPaths: [],
                applicationPath: `${workspaceRoot}/apps/web`,
                surfacePath: `/preview-replay-${revision}`,
            }),
        ),
        start_replay_revision: mock(({ revision, port, preparedRevision }) =>
            Promise.resolve({
                id: `replay-${revision}`,
                revision,
                url: `http://127.0.0.1:${port}`,
                surfacePath: preparedRevision.surfacePath,
                applicationPath: preparedRevision.applicationPath,
                browserAssets: [],
            }),
        ),
        collect_replay_browser_assets: mock().mockResolvedValue([]),
        verify_revision: mock().mockRejectedValue(new Error("screenshot flow must stay disabled")),
        cleanup_revision: mock().mockResolvedValue(undefined),
        cleanup_replay_revision: mock().mockResolvedValue(undefined),
    };
    const providerSurface = {
        id: "wallet-provider",
        applicationId: "web",
        label: "Wallet provider",
        sourcePaths: ["components/WalletProvider.tsx"],
        entry: { kind: "component" as const, targetId: "wallet-provider" },
        rootLayoutMode: "isolate" as const,
        states: [{ id: "default", label: "Default", scenarios: [] }],
        viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
    };
    const riveSurface = {
        id: "rive-footer",
        applicationId: "web",
        label: "Rive footer",
        sourcePaths: ["components/RiveFooter.tsx"],
        entry: { kind: "component" as const, targetId: "rive-footer" },
        rootLayoutMode: "inherit" as const,
        states: [{ id: "default", label: "Default", scenarios: [] }],
        viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
    };
    ProductDiffAdapterRegistry.registered = mock().mockReturnValue({
        resolve: mock().mockResolvedValue(adapter),
    });
    PreviewRunner.read_replay_plan = mock().mockResolvedValue({
        applications: [{ id: "web", applicationPath: "apps/web", adapterId: "next" }],
        surfaces: [providerSurface, riveSurface],
    });
    PreviewReplay.capture = mock((_sandbox, input: Parameters<typeof PreviewReplay.capture>[1]) =>
        Promise.resolve(
            input.plan.surfaces.map((surface) => {
                const available = surface.id === "rive-footer";
                return {
                    revision: input.revision,
                    applicationId: surface.applicationId,
                    surfaceId: surface.id,
                    stateId: "default",
                    viewportId: "desktop",
                    artifactKey: available
                        ? `replay/${surface.applicationId}/${surface.id}/default/desktop/${input.revision}/artifact.json`
                        : null,
                    fidelity: available ? ("Verified" as const) : ("Unavailable" as const),
                    diagnostics: available ? [] : ["provider could not initialize"],
                    resourceCount: available ? 14 : 0,
                    packageBytes: available ? 24_000 : 0,
                    captureDurationMs: available ? 1500 : 0,
                    validationOutcome: available ? ("Verified" as const) : ("Unavailable" as const),
                };
            }),
        ),
    );
    PreviewReplay.validate = mock((_revision, captures) => captures);
    ProductDiffReplayArtifacts.upload = mock().mockImplementation(() => {
        events.push("artifact-upload");
        return Promise.resolve(5);
    });
    GithubService.getPullRequest = mock().mockResolvedValue({
        state: "open",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
    });
    enable_replay();

    await ProductDiffRunner.run("product-diff-id");

    const settlement = update.mock.calls.at(-1)?.[0] as {
        data: { status: string; manifest: ProductDiffManifestV4 };
    };
    expect(settlement.data.status).toBe("Ready");
    expect(settlement.data.manifest.version).toBe(4);
    expect(
        settlement.data.manifest.surfaces.find((surface) => surface.id === "wallet-provider")
            ?.states[0].viewports[0].head,
    ).toMatchObject({ fidelity: "Unavailable", artifactKey: null });
    expect(
        settlement.data.manifest.surfaces.find((surface) => surface.id === "rive-footer")?.states[0]
            .viewports[0].head,
    ).toMatchObject({
        fidelity: "Verified",
        artifactKey: expect.stringContaining("artifact.json"),
    });
    expect(events).toEqual(["artifact-upload", "sandbox-cleanup"]);
});

test("keeps the screenshot capture path when replay rollout is disabled", async () => {
    mock_ready_preview_pipeline();
    replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = false;
    PreviewRunner.capture = mock((_, input: { side: "head" | "base" }) =>
        Promise.resolve(successful_capture(input.side)),
    );
    PreviewRunner.pair = mock().mockResolvedValue({ ok: true, shots: [], warnings: [] });
    GithubService.getPullRequest = mock().mockResolvedValue({
        state: "open",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
    });
    ProductDiffArtifacts.upload = mock().mockResolvedValue(1);
    PreviewReplay.capture = mock().mockRejectedValue(new Error("replay must stay disabled"));

    await ProductDiffRunner.run("product-diff-id");

    expect(PreviewRunner.capture).toHaveBeenCalledTimes(2);
    expect(PreviewReplay.capture).not.toHaveBeenCalled();
});

test("keeps the screenshot capture path when replay origin is not configured", async () => {
    mock_ready_preview_pipeline();
    replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = true;
    replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = undefined;
    PreviewRunner.capture = mock((_, input: { side: "head" | "base" }) =>
        Promise.resolve(successful_capture(input.side)),
    );
    PreviewRunner.pair = mock().mockResolvedValue({ ok: true, shots: [], warnings: [] });
    GithubService.getPullRequest = mock().mockResolvedValue({
        state: "open",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
    });
    ProductDiffArtifacts.upload = mock().mockResolvedValue(1);
    PreviewReplay.capture = mock().mockRejectedValue(new Error("replay must stay disabled"));

    await ProductDiffRunner.run("product-diff-id");

    expect(PreviewRunner.capture).toHaveBeenCalledTimes(2);
    expect(PreviewReplay.capture).not.toHaveBeenCalled();
});

test("settles replay generation as PreviewUnavailable when no surface is valid", async () => {
    const update = mock_ready_preview_pipeline();
    const workspacePlan = {
        repositoryRoot: ".",
        applicationPath: "apps/web",
        workspaceKind: "Standalone",
        installDirectory: ".",
        launchCommand: "bun run dev",
        healthPath: "/",
        router: "AppRouter",
        framework: "NextAppRouter",
        rootLayoutMode: "inherit" as const,
        dependency: {
            packageManager: "bun" as const,
            lockfileRelPath: "bun.lock",
            lockfileSha256: "lock-hash",
            workspaceDirs: ["."],
        },
    };
    const adapter: ProductDiffAdapter = {
        id: "next",
        detect: mock().mockResolvedValue({ supported: true, diagnostics: [] }),
        resolve_workspace: mock().mockResolvedValue({ plan: workspacePlan, diagnostics: [] }),
        prepare_revision: mock(({ revision, workspaceRoot }) =>
            Promise.resolve({ revision, workspaceRoot, generatedPaths: [] }),
        ),
        start_revision: mock().mockRejectedValue(new Error("screenshot flow must stay disabled")),
        prepare_replay_revision: mock(({ revision, workspaceRoot }) =>
            Promise.resolve({
                revision,
                workspaceRoot,
                generatedPaths: [],
                applicationPath: `${workspaceRoot}/apps/web`,
                surfacePath: `/preview-replay-${revision}`,
            }),
        ),
        start_replay_revision: mock(({ revision, port, preparedRevision }) =>
            Promise.resolve({
                id: `replay-${revision}`,
                revision,
                url: `http://127.0.0.1:${port}`,
                surfacePath: preparedRevision.surfacePath,
                applicationPath: preparedRevision.applicationPath,
                browserAssets: [],
            }),
        ),
        collect_replay_browser_assets: mock().mockResolvedValue([]),
        verify_revision: mock().mockRejectedValue(new Error("screenshot flow must stay disabled")),
        cleanup_revision: mock().mockResolvedValue(undefined),
        cleanup_replay_revision: mock().mockResolvedValue(undefined),
    };
    ProductDiffAdapterRegistry.registered = mock().mockReturnValue({
        resolve: mock().mockResolvedValue(adapter),
    });
    PreviewRunner.read_replay_plan = mock().mockResolvedValue(replay_plan());
    PreviewReplay.capture = mock((_sandbox, input) =>
        Promise.resolve(
            PreviewReplay.unavailable(input.revision, input.plan, "capture unavailable"),
        ),
    );
    PreviewReplay.validate = mock((_revision, captures) => captures);
    ProductDiffReplayArtifacts.upload = mock().mockResolvedValue(0);
    GithubService.getPullRequest = mock().mockResolvedValue({
        state: "open",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
    });
    enable_replay();

    await ProductDiffRunner.run("product-diff-id");

    expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({
                status: "PreviewUnavailable",
                diagnostics: expect.objectContaining({ code: "REPLAY_NO_VALID_SURFACE" }),
            }),
        }),
    );
    expect(ProductDiffReplayArtifacts.upload).not.toHaveBeenCalled();
});

test("settles an ambiguous Next workspace as ConfigurationRequired", async () => {
    const update = mock().mockResolvedValue({ count: 1 });
    prisma.productDiff.updateMany = update;
    prisma.productDiff.findUniqueOrThrow = mock().mockResolvedValue(product_diff_record());
    GithubService.getInstallationToken = mock().mockResolvedValue("github-token");
    Sandbox.create = mock().mockResolvedValue({
        commands: { run: mock().mockResolvedValue({}) },
        kill: mock().mockResolvedValue(undefined),
    });
    PreviewWorkspace.checkout = mock().mockResolvedValue(undefined);
    PreviewWorkspace.changed_paths = mock().mockResolvedValue(["packages/ui/Button.tsx"]);
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
        changedApplicationPaths: [],
    });
    PreviewRunner.detect = mock().mockResolvedValue({
        supported: false,
        reason: "multiple Next applications require selection",
        framework: null,
        nextAppDir: null,
        routeDir: null,
        pagesDir: null,
        hasExistingPagesDir: false,
        packageManager: null,
        lockfileRelPath: null,
        lockfileSha256: null,
        nextMajor: null,
        globalStylesheet: null,
        middlewarePaths: [],
        envExampleKeys: [],
        workspaceDirs: [],
        warnings: [],
    });

    await ProductDiffRunner.run("product-diff-id");

    expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({ status: "ConfigurationRequired" }),
        }),
    );
});

test("settles secret-bearing lifecycle startup input with only the safe diagnostic", async () => {
    const update = mock().mockResolvedValue({ count: 1 });
    const productDiff = product_diff_record();
    productDiff.issue.project.previewDepsHash = "cache-key";
    (
        productDiff.issue.project.projectConfig as { productDiffPreviewConfig: unknown }
    ).productDiffPreviewConfig = {
        rootLayoutMode: "inherit",
    };
    prisma.productDiff.updateMany = update;
    prisma.productDiff.findUniqueOrThrow = mock().mockResolvedValue(productDiff);
    GithubService.getInstallationToken = mock().mockResolvedValue("github-token");
    Sandbox.create = mock().mockResolvedValue({
        sandboxId: "sandbox-id",
        commands: { run: mock().mockResolvedValue({}) },
        files: { write: mock().mockResolvedValue(undefined) },
        kill: mock().mockResolvedValue(undefined),
    });
    PreviewWorkspace.checkout = mock().mockResolvedValue(undefined);
    PreviewWorkspace.changed_paths = mock().mockResolvedValue(["apps/web/app/page.tsx"]);
    PreviewRunner.inspect_next_workspace = mock().mockResolvedValue({
        workspaceKind: "Standalone",
        packageManager: "bun",
        applications: [
            {
                applicationPath: "apps/web",
                packageName: null,
                router: "AppRouter",
                hasPagesDirectory: false,
            },
        ],
        changedApplicationPaths: ["apps/web"],
    });
    PreviewRunner.detect = mock().mockResolvedValue({
        supported: true,
        reason: null,
        framework: "NextAppRouter",
        nextAppDir: "apps/web",
        routeDir: "apps/web/app",
        pagesDir: null,
        hasExistingPagesDir: false,
        packageManager: "bun",
        lockfileRelPath: "bun.lock",
        lockfileSha256: "lock-hash",
        nextMajor: 16,
        globalStylesheet: null,
        middlewarePaths: [],
        envExampleKeys: [],
        workspaceDirs: ["."],
        warnings: [],
    });
    PreviewWorkspace.write_placeholder_env = mock().mockResolvedValue(undefined);
    PreviewWorkspace.disable_middleware = mock().mockResolvedValue(undefined);
    PreviewWorkspace.restore_unexpected_edits = mock().mockResolvedValue([]);
    PreviewWorkspace.copy_harness = mock().mockResolvedValue(undefined);
    PreviewDeps.cache_key = mock().mockReturnValue("cache-key");
    PreviewDeps.cache_present = mock().mockResolvedValue(true);
    PreviewDeps.restore_into = mock().mockResolvedValue(undefined);
    ClaudeRun.execute = mock().mockResolvedValue(undefined);
    PreviewRunner.read_manifest = mock().mockResolvedValue({
        targets: [
            {
                id: "header",
                label: "Header",
                sourcePath: "components/Header.tsx",
                states: [{ id: "default", label: "Default" }],
            },
        ],
        warnings: [],
        rootLayoutMode: "inherit",
    });
    PreviewRunner.scaffold = mock().mockResolvedValue({
        ok: true,
        routeFiles: ["apps/web/matcha_preview/registry.ts"],
        warnings: [],
    });
    PreviewServer.start = mock().mockResolvedValue({
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/home/user/preview/server.log",
        port: 41337,
        process: { kill: mock().mockResolvedValue(undefined) },
    });
    PreviewServer.wait_until_ready = mock().mockResolvedValue(false);
    NextPreviewSurface.create = mock().mockResolvedValue({
        routePath: "/preview-run-head",
        generatedFiles: ["/workspace/apps/web/app/preview-run-head/[targetId]/page.tsx"],
        router: "AppRouter",
        rootLayoutMode: "inherit",
        rootLayoutRestore: null,
    });
    NextPreviewSurface.remove = mock().mockResolvedValue(undefined);
    PreviewServer.log_tail = mock().mockResolvedValue(
        "DATABASE_URL=postgres://startup-log-secret PREVIEW_TOKEN=startup-token-secret",
    );
    PreviewServer.runtime_diagnostics = mock().mockResolvedValue({
        logTail: "DATABASE_URL=postgres://startup-log-secret PREVIEW_TOKEN=startup-token-secret",
        listenerSnapshot: "",
        processSnapshot: "",
        memorySnapshot: "",
        processGroupSnapshot: "",
        httpProbeSnapshot: "",
        diskSnapshot: "",
    });

    await ProductDiffRunner.run("product-diff-id");

    const settlement = update.mock.calls.at(-1)?.[0] as {
        data: { status: string; error: string; diagnostics: unknown };
    };
    expect(settlement.data).toEqual({
        status: "PreviewUnavailable",
        error: "The preview server did not become ready.",
        diagnostics: {
            code: "PREVIEW_SERVER_UNAVAILABLE",
            stage: "startup",
            message: "The preview server did not become ready.",
            adapter: "next",
            applicationPath: "apps/web",
            workspaceKind: "Standalone",
        },
    });
    expect(JSON.stringify(settlement.data)).not.toContain("startup-log-secret");
    expect(JSON.stringify(settlement.data)).not.toContain("startup-token-secret");
    expect(PreviewServer.log_tail).not.toHaveBeenCalled();
});

test("settles a thrown capture command as PreviewUnavailable", async () => {
    const update = mock_ready_preview_pipeline();
    const productDiff = product_diff_record();
    productDiff.issue.project.previewDepsHash = "cache-key";
    (
        productDiff.issue.project.projectConfig as { productDiffPreviewConfig: unknown }
    ).productDiffPreviewConfig = {
        rootLayoutMode: "isolate",
    };
    prisma.productDiff.findUniqueOrThrow = mock().mockResolvedValue(productDiff);
    PreviewRunner.capture = mock().mockRejectedValue(
        new Error("PREVIEW_TOKEN=capture-command-secret"),
    );

    await ProductDiffRunner.run("product-diff-id");

    expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
            data: {
                status: "PreviewUnavailable",
                error: "The verified preview could not be captured.",
                diagnostics: expect.objectContaining({ code: "PREVIEW_CAPTURE_UNAVAILABLE" }),
            },
        }),
    );
});

test("retries both revisions with inheritance after isolated browser validation fails", async () => {
    mock_ready_preview_pipeline();
    const create = mock_preview_surface_creation();
    PreviewRunner.check = mock()
        .mockResolvedValueOnce({ ok: true, results: [], warnings: [] })
        .mockResolvedValueOnce({
            ok: false,
            results: [
                {
                    targetId: "header",
                    stateId: "default",
                    viewportId: "desktop",
                    ok: false,
                    problem: "NextErrorOverlay",
                    detail: "MissingProvider",
                    httpStatus: 200,
                },
            ],
            warnings: [],
        })
        .mockResolvedValue({ ok: true, results: [], warnings: [] });
    PreviewServer.runtime_diagnostics = mock().mockResolvedValue({
        logTail: "MissingProvider",
        listenerSnapshot: "",
        processSnapshot: "",
        memorySnapshot: "",
        processGroupSnapshot: "",
        httpProbeSnapshot: "",
        diskSnapshot: "",
    });
    PreviewRunner.capture = mock((_, input: { side: "head" | "base" }) =>
        Promise.resolve(successful_capture(input.side)),
    );
    PreviewRunner.pair = mock().mockResolvedValue({ ok: true, shots: [], warnings: [] });
    GithubService.getPullRequest = mock().mockResolvedValue({
        state: "open",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
    });
    ProductDiffArtifacts.upload = mock().mockResolvedValue(1);

    await ProductDiffRunner.run("product-diff-id");

    expect(create.mock.calls.map((call) => call[4])).toEqual([
        "isolate",
        "isolate",
        "inherit",
        "inherit",
    ]);
    expect(PreviewRunner.pair).toHaveBeenCalledTimes(1);
});

test("does not start inheritance when the isolated pair validates", async () => {
    mock_ready_preview_pipeline();
    const create = mock_preview_surface_creation();
    PreviewRunner.capture = mock((_, input: { side: "head" | "base" }) =>
        Promise.resolve(successful_capture(input.side)),
    );
    PreviewRunner.pair = mock().mockResolvedValue({ ok: true, shots: [], warnings: [] });
    GithubService.getPullRequest = mock().mockResolvedValue({
        state: "open",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
    });
    ProductDiffArtifacts.upload = mock().mockResolvedValue(1);

    await ProductDiffRunner.run("product-diff-id");

    expect(create.mock.calls.map((call) => call[4])).toEqual(["isolate", "isolate"]);
});

test("stops the head preview before starting the base preview", async () => {
    mock_ready_preview_pipeline();
    const events: string[] = [];
    const servers = [
        {
            url: "http://127.0.0.1:41337",
            healthPath: "/",
            logPath: "/home/user/preview/head.log",
            port: 41337,
            process: { kill: mock().mockResolvedValue(undefined) },
        },
        {
            url: "http://127.0.0.1:41338",
            healthPath: "/",
            logPath: "/home/user/preview/base.log",
            port: 41338,
            process: { kill: mock().mockResolvedValue(undefined) },
        },
    ];
    PreviewServer.start = mock().mockImplementation(() => {
        const server = servers.shift();
        if (!server) throw new Error("unexpected preview server start");
        events.push(`start:${server.port}`);
        return Promise.resolve(server);
    });
    PreviewServer.stop = mock((_, server: { port: number }) => {
        events.push(`stop:${server.port}`);
        return Promise.resolve(undefined);
    });
    PreviewRunner.capture = mock((_, input: { side: "head" | "base" }) => {
        events.push(`capture:${input.side}`);
        return Promise.resolve(successful_capture(input.side));
    });
    PreviewRunner.pair = mock().mockResolvedValue({ ok: true, shots: [], warnings: [] });
    GithubService.getPullRequest = mock().mockResolvedValue({
        state: "open",
        baseSha: "a".repeat(40),
        headSha: "b".repeat(40),
    });
    ProductDiffArtifacts.upload = mock().mockResolvedValue(1);

    await ProductDiffRunner.run("product-diff-id");

    expect(events).toEqual([
        "start:41337",
        "capture:head",
        "stop:41337",
        "start:41338",
        "capture:base",
        "stop:41338",
    ]);
});

test("reports both automatic layout attempts without persisting their failure details", async () => {
    const update = mock_ready_preview_pipeline();
    PreviewRunner.check = mock().mockResolvedValue({
        ok: false,
        results: [
            {
                targetId: "header",
                stateId: "default",
                viewportId: "desktop",
                ok: false,
                problem: "NextErrorOverlay",
                detail: "Authorization=Bearer preview-secret",
                httpStatus: 200,
            },
        ],
        warnings: [],
    });
    PreviewServer.runtime_diagnostics = mock().mockResolvedValue({
        logTail: "Authorization=Bearer preview-secret",
        listenerSnapshot: "",
        processSnapshot: "",
        memorySnapshot: "",
        processGroupSnapshot: "",
        httpProbeSnapshot: "",
        diskSnapshot: "",
    });

    await ProductDiffRunner.run("product-diff-id");

    const settlement = update.mock.calls.at(-1)?.[0] as {
        data: { diagnostics: { code: string; message: string } };
    };
    expect(settlement.data.diagnostics.code).toBe("PREVIEW_LAYOUT_ATTEMPTS_FAILED");
    expect(settlement.data.diagnostics.message).toContain("isolate");
    expect(settlement.data.diagnostics.message).toContain("inherit");
    expect(JSON.stringify(settlement.data)).not.toContain("preview-secret");
});

test("settles screenshot pairing failures as Matcha failures", async () => {
    const update = mock_ready_preview_pipeline();
    PreviewRunner.capture = mock((_, input: { side: "head" | "base" }) =>
        Promise.resolve(successful_capture(input.side)),
    );
    PreviewRunner.pair = mock().mockResolvedValue({ ok: false, shots: [], warnings: [] });

    await ProductDiffRunner.run("product-diff-id");

    expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
            data: {
                status: "Failed",
                error: "The screenshot pairing service failed.",
                diagnostics: expect.objectContaining({ code: "PRODUCT_DIFF_PAIRING_FAILED" }),
            },
        }),
    );
});

test("does not persist manifest metadata for stale Product Diffs", async () => {
    const update = mock_ready_preview_pipeline();
    PreviewRunner.capture = mock((_, input: { side: "head" | "base" }) =>
        Promise.resolve(successful_capture(input.side)),
    );
    PreviewRunner.pair = mock().mockResolvedValue({ ok: true, shots: [], warnings: [] });
    GithubService.getPullRequest = mock()
        .mockResolvedValueOnce({
            state: "open",
            baseSha: "a".repeat(40),
            headSha: "b".repeat(40),
        })
        .mockResolvedValueOnce({
            state: "closed",
            baseSha: "a".repeat(40),
            headSha: "b".repeat(40),
        });
    ProductDiffArtifacts.upload = mock().mockResolvedValue(1);

    await ProductDiffRunner.run("product-diff-id");

    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { status: "Stale" } }));
    const settlement = update.mock.calls.at(-1)?.[0] as { data: Record<string, unknown> };
    expect(settlement.data).not.toHaveProperty("manifest");
    expect(settlement.data).not.toHaveProperty("artifactPrefix");
});

test("maps preview startup and browser-validation failures to PreviewUnavailable", () => {
    expect(product_diff_failure_status("start head dev server")).toBe("PreviewUnavailable");
    expect(product_diff_failure_status("verify the base preview surface")).toBe(
        "PreviewUnavailable",
    );
    expect(product_diff_failure_status("run the harness agent")).toBe("Failed");
});

test("uses only structured browser-check fields in persisted preview errors", () => {
    const error = preview_check_error(
        "head",
        {
            targetId: "header-nav",
            stateId: "signed-out",
            problem: "ConsoleError",
            detail: "Missing preview provider",
            httpStatus: 503,
        },
        "/preview-run-a",
    );

    expect(error.message).toContain("target=header-nav");
    expect(error.message).toContain("state=signed-out");
    expect(error.message).toContain("problem=ConsoleError");
    expect(error.message).toContain("httpStatus=503");
    expect(error.message).toContain("route=/preview-run-a");
    expect(error.message).not.toContain("Missing preview provider");
});

test("does not persist JSON headers or control-separated browser detail", () => {
    const checkError = preview_check_error(
        "head",
        {
            targetId: "header-nav",
            stateId: "signed-out",
            problem: "ConsoleError",
            detail: '{"Authorization":"Bearer json-secret","Cookie":"session=json-cookie"}\u001eaccess_token=control-secret',
            httpStatus: 401,
        },
        "/preview-run-a",
    );
    const diagnostic = preview_unavailable_diagnostic(
        "verify the head preview surface",
        checkError.message,
        "apps/web",
    );

    expect(diagnostic.message).toContain("target=header-nav");
    expect(diagnostic.message).toContain("state=signed-out");
    expect(diagnostic.message).toContain("problem=ConsoleError");
    expect(diagnostic.message).toContain("httpStatus=401");
    expect(diagnostic.message).toContain("route=/preview-run-a");
    expect(diagnostic.message).not.toContain("json-secret");
    expect(diagnostic.message).not.toContain("json-cookie");
    expect(diagnostic.message).not.toContain("control-secret");
    expect(diagnostic.message).not.toContain("Authorization");
    expect(diagnostic.message).not.toContain("Cookie");
});

test("uses a static persisted error for unstructured preview failures", () => {
    const message = preview_unavailable_error_message(
        "verify the head preview surface",
        new Error(
            '{"Authorization":"Bearer fallback-secret","Cookie":"session=fallback-cookie"}\u001efallback-control-secret',
        ),
    );

    expect(message).toBe("Preview unavailable during verify the head preview surface.");
    expect(message).not.toContain("fallback-secret");
    expect(message).not.toContain("fallback-cookie");
    expect(message).not.toContain("fallback-control-secret");
});

test("drops invalid structured field values from persisted preview errors", () => {
    const error = preview_check_error(
        "base",
        {
            targetId: "target-\u001eidentifier-secret",
            stateId: "state-\u001estate-secret",
            problem: "ConsoleError\u001eproblem-secret",
            detail: "detail-secret",
            httpStatus: 700,
        },
        "/preview-run-a\u001eroute-secret",
    );

    expect(error.message).toContain("revision=base");
    expect(error.message).toContain("target=unknown");
    expect(error.message).toContain("state=unknown");
    expect(error.message).toContain("problem=Unknown");
    expect(error.message).toContain("route=/unknown");
    expect(error.message).not.toContain("httpStatus=");
    expect(error.message).not.toContain("identifier-secret");
    expect(error.message).not.toContain("state-secret");
    expect(error.message).not.toContain("problem-secret");
    expect(error.message).not.toContain("detail-secret");
    expect(error.message).not.toContain("route-secret");
});

afterEach(() => {
    prisma.productDiff.updateMany = originalProductDiffUpdate;
    prisma.productDiff.findUniqueOrThrow = originalProductDiffFind;
    GithubService.getInstallationToken = originalGitHubToken;
    Sandbox.create = originalSandboxCreate;
    PreviewWorkspace.checkout = originalCheckout;
    PreviewWorkspace.changed_paths = originalChangedPaths;
    PreviewRunner.detect = originalDetect;
    PreviewRunner.inspect_next_workspace = originalInspectNextWorkspace;
    PreviewWorkspace.write_placeholder_env = originalWritePlaceholderEnv;
    PreviewWorkspace.disable_middleware = originalDisableMiddleware;
    PreviewWorkspace.restore_unexpected_edits = originalRestoreUnexpectedEdits;
    PreviewWorkspace.copy_harness = originalCopyHarness;
    PreviewDeps.cache_key = originalCacheKey;
    PreviewDeps.cache_present = originalCachePresent;
    PreviewDeps.restore_into = originalRestoreInto;
    ClaudeRun.execute = originalClaudeExecute;
    PreviewRunner.read_manifest = originalReadManifest;
    PreviewRunner.scaffold = originalScaffold;
    PreviewServer.start = originalPreviewStart;
    PreviewServer.wait_until_ready = originalWaitUntilReady;
    PreviewServer.log_tail = originalLogTail;
    PreviewServer.runtime_diagnostics = originalRuntimeDiagnostics;
    PreviewRunner.capture = originalCapture;
    PreviewRunner.pair = originalPair;
    PreviewRunner.check = originalCheck;
    NextPreviewSurface.create = originalCreateSurface;
    NextPreviewSurface.remove = originalRemoveSurface;
    PreviewServer.stop = originalStop;
    GithubService.getPullRequest = originalGetPullRequest;
    ProductDiffArtifacts.upload = originalUpload;
    ProductDiffAdapterRegistry.registered = originalRegisteredAdapters;
    PreviewRunner.read_replay_plan = originalReadReplayPlan;
    PreviewReplay.capture = originalReplayCapture;
    PreviewReplay.validate = originalReplayValidate;
    ProductDiffReplayArtifacts.upload = originalReplayUpload;
    ProductDiffRunner.run = originalProductDiffRun;
    replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = originalReplayEnabled;
    replayEnvironment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = originalReplayOrigin;
});
