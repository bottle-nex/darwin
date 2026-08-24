import { afterEach, expect, mock, test } from "bun:test";
import type Logger from "@trymatcha/logger";
import type { Sandbox } from "e2b";

import type { ProductDiffWorkspacePlan } from "../../adapter.contract";
import type { ProductDiffAdapterRuntime } from "../../adapter.registry";
import PreviewRunner from "../../../service.preview_runner";
import PreviewWorkspace from "../../../service.preview_workspace";
import NextProductDiffAdapter from "./service.next_product_diff_adapter";

const originalInspect = PreviewRunner.inspect_next_workspace;
const originalDetect = PreviewRunner.detect;
const originalWritePlaceholderEnv = PreviewWorkspace.write_placeholder_env;
const originalDisableMiddleware = PreviewWorkspace.disable_middleware;

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

afterEach(() => {
    PreviewRunner.inspect_next_workspace = originalInspect;
    PreviewRunner.detect = originalDetect;
    PreviewWorkspace.write_placeholder_env = originalWritePlaceholderEnv;
    PreviewWorkspace.disable_middleware = originalDisableMiddleware;
});
