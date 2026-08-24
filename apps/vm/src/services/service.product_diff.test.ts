import { afterEach, expect, mock, test } from "bun:test";
import { prisma } from "@trymatcha/database";
import { Sandbox } from "e2b";

import {
    default as ProductDiffRunner,
    product_diff_failure_status,
    preview_check_error,
    preview_unavailable_error_message,
    preview_unavailable_diagnostic,
} from "./service.product_diff";
import GithubService from "./service.github";
import PreviewDeps from "./service.preview_deps";
import PreviewRunner from "./service.preview_runner";
import PreviewServer from "./service.preview_server";
import PreviewWorkspace from "./service.preview_workspace";
import ClaudeRun from "./service.claude_run";
import ProductDiffArtifacts from "./service.product_diff_artifacts";
import NextPreviewSurface from "./product_diff/adapters/next/service.next_preview_surface";

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
const originalCapture = PreviewRunner.capture;
const originalPair = PreviewRunner.pair;
const originalCheck = PreviewRunner.check;
const originalCreateSurface = NextPreviewSurface.create;
const originalRemoveSurface = NextPreviewSurface.remove;
const originalStop = PreviewServer.stop;
const originalGetPullRequest = GithubService.getPullRequest;
const originalUpload = ProductDiffArtifacts.upload;

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
    });
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
    });
    PreviewServer.log_tail = mock().mockResolvedValue(
        "DATABASE_URL=postgres://startup-log-secret PREVIEW_TOKEN=startup-token-secret",
    );

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
    PreviewRunner.capture = originalCapture;
    PreviewRunner.pair = originalPair;
    PreviewRunner.check = originalCheck;
    NextPreviewSurface.create = originalCreateSurface;
    NextPreviewSurface.remove = originalRemoveSurface;
    PreviewServer.stop = originalStop;
    GithubService.getPullRequest = originalGetPullRequest;
    ProductDiffArtifacts.upload = originalUpload;
});
