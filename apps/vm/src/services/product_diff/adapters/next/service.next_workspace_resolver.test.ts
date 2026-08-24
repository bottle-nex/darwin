import { expect, test } from "bun:test";

import type { NextWorkspaceInspection } from "../../../service.preview_runner";
import { resolve_next_workspace } from "./service.next_workspace_resolver";

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

test("builds an Nx workspace-root launch plan for an application change", () => {
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
        launchCommand: "bun nx run @acme/marketing:dev",
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
