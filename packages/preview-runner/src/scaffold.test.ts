import { afterAll, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { scaffold } from "./scaffold";

const fixtureRoots: string[] = [];

function fixture_root(): string {
    const root = mkdtempSync(join(tmpdir(), "matcha-scaffold-"));
    fixtureRoots.push(root);
    mkdirSync(join(root, "apps", "web", "app"), { recursive: true });
    return root;
}

test("creates harness support files without creating a fixed preview route", () => {
    const root = fixture_root();

    const result = scaffold({
        workspaceRoot: root,
        detect: {
            supported: true,
            reason: null,
            framework: "NextAppRouter",
            nextAppDir: "apps/web",
            routeDir: "apps/web/app",
            pagesDir: null,
            hasExistingPagesDir: false,
            packageManager: "bun",
            lockfileRelPath: "bun.lock",
            lockfileSha256: "checksum",
            nextMajor: 15,
            globalStylesheet: null,
            middlewarePaths: [],
            envExampleKeys: [],
            workspaceDirs: [],
            warnings: [],
        },
    });

    expect(result.ok).toBe(true);
    expect(result.routeFiles).toEqual([
        "apps/web/matcha_preview/targets/matcha-probe.tsx",
        "apps/web/matcha_preview/registry.ts",
    ]);
    expect(existsSync(join(root, "apps", "web", "app", "preview-run-a"))).toBe(false);
});

afterAll(() => {
    for (const root of fixtureRoots) rmSync(root, { recursive: true, force: true });
});
