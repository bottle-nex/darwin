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

    expect(plan.command).toBe("bun nx run marketing:serve -- --host=127.0.0.1 --port=41337");
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
