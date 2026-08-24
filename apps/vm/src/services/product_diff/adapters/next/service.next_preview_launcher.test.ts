import { expect, test } from "bun:test";

import NextPreviewLauncher from "./service.next_preview_launcher";

test("uses the selected package script through pnpm filtering", () => {
    const plan = NextPreviewLauncher.create({
        workspaceKind: "Turborepo",
        packageManager: "pnpm",
        packageName: "@acme/marketing",
        applicationPath: "apps/marketing",
        port: 41337,
    });

    expect(plan.command).toBe(
        "pnpm --filter @acme/marketing run dev -- --hostname 127.0.0.1 --port 41337",
    );
});

test("uses an Nx serve target with controlled host and port arguments", () => {
    const plan = NextPreviewLauncher.create({
        workspaceKind: "Nx",
        packageManager: "bun",
        packageName: "marketing",
        applicationPath: "apps/marketing",
        port: 41337,
    });

    expect(plan.command).toBe(
        "bun x --no-install nx run marketing:serve -- --host=127.0.0.1 --port=41337",
    );
});

test("quotes a standalone application path before supplying it to npm", () => {
    const plan = NextPreviewLauncher.create({
        workspaceKind: "Standalone",
        packageManager: "npm",
        applicationPath: "apps/marketing site",
        port: 41337,
    });

    expect(plan.command).toBe(
        "npm --prefix 'apps/marketing site' run dev -- --hostname 127.0.0.1 --port 41337",
    );
});

test("escapes an apostrophe in a standalone application path", () => {
    const plan = NextPreviewLauncher.create({
        workspaceKind: "Standalone",
        packageManager: "pnpm",
        applicationPath: "apps/marketing's site",
        port: 41337,
    });

    expect(plan.command).toBe(
        "pnpm --dir 'apps/marketing'\"'\"'s site' run dev -- --hostname 127.0.0.1 --port 41337",
    );
});

test("keeps the resolver's Bun Nx serve command on the local target", () => {
    const plan = NextPreviewLauncher.from_workspace_plan({
        workspaceRoot: "/home/user/workspace/head",
        workspacePlan: {
            repositoryRoot: ".",
            applicationPath: "apps/marketing",
            workspaceKind: "Nx",
            installDirectory: ".",
            launchCommand: "bun nx run @acme/marketing:serve",
            healthPath: "/",
            router: "AppRouter",
            framework: "NextAppRouter",
            dependency: {
                packageManager: "bun",
                lockfileRelPath: "bun.lock",
                lockfileSha256: "lock-hash",
                workspaceDirs: ["."],
            },
        },
        port: 41337,
    });

    expect(plan.command).toBe(
        "bun x --no-install nx run @acme/marketing:serve -- --host=127.0.0.1 --port=41337",
    );
});

test("rejects a health path that can alter the probe shell command", () => {
    expect(() =>
        NextPreviewLauncher.create({
            workspaceKind: "Standalone",
            packageManager: "pnpm",
            applicationPath: ".",
            healthPath: "/ready; touch /tmp/pwned",
            port: 41337,
        }),
    ).toThrow();
});

test("rejects an override containing shell control operators", () => {
    expect(() => NextPreviewLauncher.validate_override("pnpm dev && curl bad.example")).toThrow();
});

test("rejects an override that sets its own network binding", () => {
    expect(() =>
        NextPreviewLauncher.create({
            workspaceKind: "Standalone",
            packageManager: "pnpm",
            applicationPath: ".",
            port: 41337,
            launchCommand: "pnpm run dev -- --port 3000",
        }),
    ).toThrow();
});

test("rejects an override with an attached short host argument", () => {
    expect(() => NextPreviewLauncher.validate_override("pnpm run dev -- -H0.0.0.0")).toThrow();
});

test("rejects an override with a short host argument", () => {
    expect(() => NextPreviewLauncher.validate_override("pnpm run dev -- -H 0.0.0.0")).toThrow();
});
