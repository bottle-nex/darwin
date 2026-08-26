import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { detect } from "../../detect";
import { inspect_next_workspace } from "./workspace";

const fixtureRoots: string[] = [];

function fixtureRoot(
    name:
        | "turbo-next"
        | "nested-next"
        | "nx-next"
        | "nx-project-next"
        | "standalone-next"
        | "pnpm-workspace-next",
): string {
    const root = mkdtempSync(join(tmpdir(), `matcha-${name}-`));
    fixtureRoots.push(root);

    const files: Record<string, string> = {
        "turbo-next": [
            "pnpm-lock.yaml",
            "pnpm-workspace.yaml",
            "turbo.json",
            "apps/marketing/package.json",
            "apps/marketing/app/layout.tsx",
            "packages/ui/package.json",
        ],
        "nested-next": [
            "bun.lock",
            "packages/one/two/three/four/five/site/package.json",
            "packages/one/two/three/four/five/site/src/app/layout.tsx",
        ],
        "nx-next": [
            "yarn.lock",
            "nx.json",
            "apps/store/package.json",
            "apps/store/project.json",
            "apps/store/pages/index.tsx",
        ],
        "nx-project-next": [
            "bun.lock",
            "nx.json",
            "package.json",
            "apps/admin/project.json",
            "apps/admin/app/layout.tsx",
        ],
        "standalone-next": ["package-lock.json", "package.json", "src/app/layout.tsx"],
        "pnpm-workspace-next": [
            "pnpm-lock.yaml",
            "pnpm-workspace.yaml",
            "apps/store/package.json",
            "apps/store/app/layout.tsx",
        ],
    }[name].reduce<Record<string, string>>((result, path) => {
        if (path === "apps/store/project.json") {
            result[path] = JSON.stringify({
                name: "store",
                targets: {
                    build: { executor: "@nx/next:build" },
                    serve: {
                        executor: "@nx/next:server",
                        configurations: { production: { dev: false } },
                    },
                },
            });
        } else if (path === "apps/admin/project.json") {
            result[path] = JSON.stringify({
                name: "admin",
                sourceRoot: "apps/admin",
                projectType: "application",
                targets: {
                    compile: { executor: "@nx/next:build" },
                    preview: {
                        executor: "@nx/next:server",
                        options: { buildTarget: "admin:compile" },
                        configurations: {
                            production: { buildTarget: "admin:compile:production", dev: false },
                        },
                    },
                },
            });
        } else if (path.endsWith("package.json")) {
            const packageName =
                name === "turbo-next" && path === "apps/marketing/package.json"
                    ? "@acme/marketing"
                    : name === "nx-next"
                      ? "@acme/store"
                      : name === "nx-project-next"
                        ? "nx-project-workspace"
                        : name === "standalone-next"
                          ? "website"
                          : name === "pnpm-workspace-next"
                            ? "@acme/store"
                            : "@acme/site";
            result[path] = JSON.stringify({
                name: packageName,
                dependencies:
                    path.includes("packages/ui") || name === "nx-project-next"
                        ? {}
                        : { next: "15.0.0" },
                devDependencies:
                    name === "nx-project-next"
                        ? { next: "15.0.0", nx: "20.0.0", "@nx/next": "20.0.0" }
                        : undefined,
            });
        } else {
            result[path] = path.endsWith(".tsx")
                ? "export default function Layout() { return null; }"
                : "";
        }
        return result;
    }, {});

    for (const [path, source] of Object.entries(files)) {
        mkdirSync(join(root, path, ".."), { recursive: true });
        writeFileSync(join(root, path), source);
    }

    return root;
}

test("finds a Next application in a pnpm Turborepo", () => {
    const inspection = inspect_next_workspace(fixtureRoot("turbo-next"), ["packages/ui/Hero.tsx"]);

    expect(inspection.workspaceKind).toBe("Turborepo");
    expect(inspection.packageManager).toBe("pnpm");
    expect(inspection.applications).toEqual([
        expect.objectContaining({
            applicationPath: "apps/marketing",
            packageName: "@acme/marketing",
            router: "AppRouter",
            hasPagesDirectory: false,
        }),
    ]);
    expect(inspection.changedApplicationPaths).toEqual([]);
});

test("finds Next applications beyond four directory levels", () => {
    const inspection = inspect_next_workspace(fixtureRoot("nested-next"), [
        "packages/one/two/three/four/five/site/src/app/page.tsx",
    ]);

    expect(inspection.applications).toEqual([
        expect.objectContaining({
            applicationPath: "packages/one/two/three/four/five/site",
            router: "AppRouter",
        }),
    ]);
    expect(inspection.changedApplicationPaths).toEqual(["packages/one/two/three/four/five/site"]);
});

test("detects a deeply nested Next application without a scan-depth cutoff", () => {
    const detected = detect({
        workspaceRoot: fixtureRoot("nested-next"),
        changedPaths: ["packages/one/two/three/four/five/site/src/app/page.tsx"],
    });

    expect(detected).toMatchObject({
        supported: true,
        nextAppDir: "packages/one/two/three/four/five/site",
    });
});

test("classifies Nx and standalone Next workspaces from root metadata", () => {
    expect(inspect_next_workspace(fixtureRoot("nx-next"), [])).toMatchObject({
        workspaceKind: "Nx",
        applications: [
            {
                applicationPath: "apps/store",
                packageName: "store",
                nxTargets: {
                    build: "store:build:production",
                    serve: "store:serve:production",
                },
            },
        ],
    });
    expect(inspect_next_workspace(fixtureRoot("standalone-next"), []).workspaceKind).toBe(
        "Standalone",
    );
});

test("discovers an Nx Next project from project.json without an app package manifest", () => {
    const root = fixtureRoot("nx-project-next");
    const inspection = inspect_next_workspace(root, ["apps/admin/app/page.tsx"]);

    expect(inspection).toMatchObject({
        workspaceKind: "Nx",
        packageManager: "bun",
        applications: [
            {
                applicationPath: "apps/admin",
                packageName: "admin",
                router: "AppRouter",
                nxTargets: {
                    build: "admin:compile:production",
                    serve: "admin:preview:production",
                },
            },
        ],
        changedApplicationPaths: ["apps/admin"],
    });
    expect(
        detect({ workspaceRoot: root, changedPaths: ["apps/admin/project.json"] }),
    ).toMatchObject({
        supported: true,
        nextAppDir: "apps/admin",
        framework: "NextAppRouter",
    });
});

test("classifies a plain pnpm workspace without Turborepo metadata", () => {
    const inspection = inspect_next_workspace(fixtureRoot("pnpm-workspace-next"), []);

    expect(inspection).toMatchObject({
        workspaceKind: "PnpmWorkspace",
        packageManager: "pnpm",
        applications: [expect.objectContaining({ applicationPath: "apps/store" })],
    });
});

test("skips cyclic directory symlinks while inspecting Next workspaces", () => {
    const root = fixtureRoot("standalone-next");
    symlinkSync(root, join(root, "cycle"), "dir");

    expect(inspect_next_workspace(root, [])).toMatchObject({
        applications: [expect.objectContaining({ applicationPath: "." })],
    });
    expect(detect({ workspaceRoot: root, changedPaths: [] })).toMatchObject({
        supported: true,
        nextAppDir: ".",
    });
});

afterAll(() => {
    for (const root of fixtureRoots) rmSync(root, { recursive: true, force: true });
});
