import { expect, test } from "bun:test";

import type { NextWorkspaceInspection } from "../../../service.preview_runner";
import { resolve_next_workspace, resolve_next_workspaces } from "./service.next_workspace_resolver";

const twoAppInspection: NextWorkspaceInspection = {
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
    changedApplicationPaths: [],
};

test("reports ambiguous shared-package changes instead of selecting an app", () => {
    const result = resolve_next_workspace(twoAppInspection, ["packages/ui/Button.tsx"], null);

    expect(result).toMatchObject({ code: "APPLICATION_SELECTION_AMBIGUOUS" });
});

test("uses an explicit application path before changed paths", () => {
    const result = resolve_next_workspace(twoAppInspection, ["apps/admin/pages/users.tsx"], {
        applicationPath: "apps/marketing",
    });

    expect(result).toMatchObject({
        applicationPath: "apps/marketing",
        installDirectory: ".",
        launchCommand: "pnpm --filter @acme/marketing run dev",
    });
});

test("retains an owner-selected root layout mode in the workspace plan", () => {
    const result = resolve_next_workspace(twoAppInspection, ["apps/marketing/app/page.tsx"], {
        rootLayoutMode: "isolate",
    });

    expect(result).toMatchObject({
        applicationPath: "apps/marketing",
        rootLayoutMode: "isolate",
    });
});

test("builds an Nx workspace-root serve plan for an application change", () => {
    const result = resolve_next_workspace(
        {
            ...twoAppInspection,
            workspaceKind: "Nx",
            packageManager: "bun",
            applications: [twoAppInspection.applications[0]],
        },
        ["apps/marketing/app/page.tsx"],
        null,
    );

    expect(result).toMatchObject({
        applicationPath: "apps/marketing",
        installDirectory: ".",
        launchCommand: "bun nx run @acme/marketing:serve",
    });
});

test("retains declared Nx production targets in the resolved workspace plan", () => {
    const result = resolve_next_workspace(
        {
            workspaceKind: "Nx",
            packageManager: "bun",
            applications: [
                {
                    applicationPath: "apps/admin",
                    packageName: "admin",
                    router: "AppRouter",
                    hasPagesDirectory: false,
                    nxTargets: {
                        build: "admin:compile:production",
                        serve: "admin:preview:production",
                    },
                },
            ],
            changedApplicationPaths: ["apps/admin"],
        },
        ["apps/admin/app/page.tsx"],
        null,
    );

    expect(result).toMatchObject({
        applicationPath: "apps/admin",
        nxTargets: {
            build: "admin:compile:production",
            serve: "admin:preview:production",
        },
    });
});

test("builds a pnpm workspace launch plan without Turborepo metadata", () => {
    const result = resolve_next_workspace(
        {
            ...twoAppInspection,
            workspaceKind: "PnpmWorkspace",
            applications: [twoAppInspection.applications[0]],
        },
        ["apps/marketing/app/page.tsx"],
        null,
    );

    expect(result).toMatchObject({
        applicationPath: "apps/marketing",
        installDirectory: ".",
        launchCommand: "pnpm --filter @acme/marketing run dev",
    });
});

test("resolves every changed application for a replay workspace", () => {
    const result = resolve_next_workspaces(
        { ...twoAppInspection, changedApplicationPaths: ["apps/admin", "apps/marketing"] },
        ["apps/marketing/app/page.tsx", "apps/admin/pages/users.tsx"],
        null,
    );

    expect(result).toMatchObject({
        diagnostics: [],
        plans: [
            { applicationPath: "apps/admin", framework: "NextPagesRouter" },
            { applicationPath: "apps/marketing", framework: "NextAppRouter" },
        ],
    });
});
