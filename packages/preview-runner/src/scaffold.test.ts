import { afterAll, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { read_harness_manifest, scaffold } from "./scaffold";

const fixtureRoots: string[] = [];

function fixture_root(): string {
    const root = mkdtempSync(join(tmpdir(), "matcha-scaffold-"));
    fixtureRoots.push(root);
    mkdirSync(join(root, "apps", "web", "app"), { recursive: true });
    return root;
}

function install_rive_canvas_runtime(root: string): void {
    const packageDirectory = join(root, "apps", "web", "node_modules", "@rive-app", "canvas");
    mkdirSync(packageDirectory, { recursive: true });
    writeFileSync(
        join(packageDirectory, "package.json"),
        JSON.stringify({ name: "@rive-app/canvas" }),
    );
    writeFileSync(join(packageDirectory, "rive.wasm"), "rive-runtime");

    const reactPackageDirectory = join(
        root,
        "apps",
        "web",
        "node_modules",
        "@rive-app",
        "react-canvas",
    );
    mkdirSync(reactPackageDirectory, { recursive: true });
    writeFileSync(
        join(reactPackageDirectory, "package.json"),
        JSON.stringify({
            name: "@rive-app/react-canvas",
            dependencies: { "@rive-app/canvas": "2.34.2" },
        }),
    );
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
        "apps/web/matcha_preview/PreviewRuntime.tsx",
        "apps/web/matcha_preview/targets/matcha-probe.tsx",
        "apps/web/matcha_preview/registry.ts",
    ]);
    expect(existsSync(join(root, "apps", "web", "app", "preview-run-a"))).toBe(false);
});

test("defaults to inherited layout mode when the harness manifest has not been written", () => {
    const root = fixture_root();

    expect(read_harness_manifest(join(root, "apps", "web"))).toMatchObject({
        rootLayoutMode: "inherit",
        targets: [],
        warnings: [],
    });
});

test("serves the installed Rive runtime from a Matcha-owned local asset path", () => {
    const root = fixture_root();
    install_rive_canvas_runtime(root);

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
            packageManager: "pnpm",
            lockfileRelPath: "pnpm-lock.yaml",
            lockfileSha256: "checksum",
            nextMajor: 15,
            globalStylesheet: null,
            middlewarePaths: [],
            envExampleKeys: [],
            workspaceDirs: [],
            warnings: [],
        },
    });

    const applicationDirectory = join(root, "apps", "web");
    const wasm = join(
        applicationDirectory,
        "public",
        "matcha-preview-runtime",
        "rive",
        "rive.wasm",
    );
    const bootstrap = join(applicationDirectory, "matcha_preview", "PreviewRuntime.tsx");

    expect(result.ok).toBe(true);
    expect(result.routeFiles).toContain("apps/web/matcha_preview/PreviewRuntime.tsx");
    expect(readFileSync(wasm, "utf8")).toBe("rive-runtime");
    expect(readFileSync(bootstrap, "utf8")).toContain(
        'RuntimeLoader.setWasmUrl("/matcha-preview-runtime/rive/rive.wasm")',
    );
});

test("configures the standalone Rive canvas package from its local runtime asset", () => {
    const root = fixture_root();
    const applicationDirectory = join(root, "apps", "web");
    const canvasDirectory = join(applicationDirectory, "node_modules", "@rive-app", "canvas");
    mkdirSync(canvasDirectory, { recursive: true });
    writeFileSync(
        join(canvasDirectory, "package.json"),
        JSON.stringify({ name: "@rive-app/canvas" }),
    );
    writeFileSync(join(canvasDirectory, "rive.wasm"), "standalone-rive-runtime");

    scaffold({
        workspaceRoot: root,
        detect: {
            supported: true,
            reason: null,
            framework: "NextAppRouter",
            nextAppDir: "apps/web",
            routeDir: "apps/web/app",
            pagesDir: null,
            hasExistingPagesDir: false,
            packageManager: "pnpm",
            lockfileRelPath: "pnpm-lock.yaml",
            lockfileSha256: "checksum",
            nextMajor: 15,
            globalStylesheet: null,
            middlewarePaths: [],
            envExampleKeys: [],
            workspaceDirs: [],
            warnings: [],
        },
    });

    expect(
        readFileSync(join(applicationDirectory, "matcha_preview", "PreviewRuntime.tsx"), "utf8"),
    ).toContain('import { RuntimeLoader } from "@rive-app/canvas";');
    expect(
        readFileSync(
            join(applicationDirectory, "public", "matcha-preview-runtime", "rive", "rive.wasm"),
            "utf8",
        ),
    ).toBe("standalone-rive-runtime");
});

test("ignores a Rive runtime resolved from outside the workspace", () => {
    const container = mkdtempSync(join(tmpdir(), "matcha-scaffold-boundary-"));
    fixtureRoots.push(container);
    const root = join(container, "workspace");
    const applicationDirectory = join(root, "apps", "web");
    mkdirSync(join(applicationDirectory, "app"), { recursive: true });
    writeFileSync(join(applicationDirectory, "package.json"), JSON.stringify({ name: "web" }));

    const canvasDirectory = join(container, "node_modules", "@rive-app", "canvas");
    mkdirSync(canvasDirectory, { recursive: true });
    writeFileSync(
        join(canvasDirectory, "package.json"),
        JSON.stringify({ name: "@rive-app/canvas" }),
    );
    writeFileSync(join(canvasDirectory, "rive.wasm"), "ancestor-rive-runtime");

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
            packageManager: "pnpm",
            lockfileRelPath: "pnpm-lock.yaml",
            lockfileSha256: "checksum",
            nextMajor: 15,
            globalStylesheet: null,
            middlewarePaths: [],
            envExampleKeys: [],
            workspaceDirs: [],
            warnings: [],
        },
    });

    expect(result.routeFiles).not.toContain(
        "apps/web/public/matcha-preview-runtime/rive/rive.wasm",
    );
    expect(
        existsSync(
            join(applicationDirectory, "public", "matcha-preview-runtime", "rive", "rive.wasm"),
        ),
    ).toBe(false);
    expect(
        readFileSync(join(applicationDirectory, "matcha_preview", "PreviewRuntime.tsx"), "utf8"),
    ).not.toContain("@rive-app/canvas");
});

afterAll(() => {
    for (const root of fixtureRoots) rmSync(root, { recursive: true, force: true });
});
