import { afterAll, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { create_next_preview_surface, remove_next_preview_surface } from "./preview_surface";

const fixtureRoots: string[] = [];

function fixture_root(router: "AppRouter" | "PagesRouter"): string {
    const root = join(tmpdir(), `matcha-surface-${crypto.randomUUID()}`);
    fixtureRoots.push(root);
    const applicationRoot = join(root, "apps", "web");
    const routeRoot =
        router === "AppRouter" ? join(applicationRoot, "app") : join(applicationRoot, "pages");

    mkdirSync(routeRoot, { recursive: true });
    writeFileSync(
        join(applicationRoot, "package.json"),
        JSON.stringify({ dependencies: { next: "15.0.0" } }),
    );
    mkdirSync(join(applicationRoot, "matcha_preview"), { recursive: true });
    writeFileSync(
        join(applicationRoot, "matcha_preview", "registry.ts"),
        "export const TARGETS = {};\n",
    );
    return root;
}

test("creates only the selected App Router surface at its job-scoped route", () => {
    const root = fixture_root("AppRouter");

    const surface = create_next_preview_surface(root, {
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
    });

    expect(surface).toMatchObject({
        routePath: "/preview-run-a",
        router: "AppRouter",
        generatedFiles: [join(root, "apps/web/app/preview-run-a/[targetId]/page.tsx")],
    });
    expect(existsSync(join(root, "apps/web/pages/preview-run-a/[targetId].tsx"))).toBe(false);
});

test("removes an App Router surface before creating a Pages Router surface", () => {
    const root = fixture_root("AppRouter");
    mkdirSync(join(root, "apps/web/pages"), { recursive: true });
    const first = create_next_preview_surface(root, {
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
    });

    remove_next_preview_surface(first);

    const second = create_next_preview_surface(root, {
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "PagesRouter",
    });

    expect(existsSync(first.generatedFiles[0]!)).toBe(false);
    expect(existsSync(second.generatedFiles[0]!)).toBe(true);
});

test("rejects malformed job-scoped route segments", () => {
    const root = fixture_root("AppRouter");

    expect(() =>
        create_next_preview_surface(root, {
            applicationPath: "apps/web",
            routeSegment: "Preview_Run",
            router: "AppRouter",
        }),
    ).toThrow();
});

test("refuses to overwrite a customer route at the generated path", () => {
    const root = fixture_root("PagesRouter");
    const customerRoute = join(root, "apps/web/pages/preview-run-a");
    mkdirSync(customerRoute, { recursive: true });
    writeFileSync(
        join(customerRoute, "index.tsx"),
        "export default function Page() { return null; }\n",
    );

    expect(() =>
        create_next_preview_surface(root, {
            applicationPath: "apps/web",
            routeSegment: "preview-run-a",
            router: "PagesRouter",
        }),
    ).toThrow("already exists");
});

test("removes exactly tracked generated files deepest path first", () => {
    const root = fixture_root("AppRouter");
    const shallow = join(root, "generated.ts");
    const deep = join(root, "nested", "generated.ts");
    mkdirSync(join(root, "nested"), { recursive: true });
    writeFileSync(shallow, "shallow");
    writeFileSync(deep, "deep");
    const removed: string[] = [];

    remove_next_preview_surface(
        {
            routePath: "/preview-run-a",
            router: "AppRouter",
            generatedFiles: [shallow, deep],
        },
        (file) => {
            removed.push(file);
            rmSync(file);
        },
    );

    expect(removed).toEqual([deep, shallow]);
    expect(existsSync(shallow)).toBe(false);
    expect(existsSync(deep)).toBe(false);
});

test("does not remove a tracked path more than once", () => {
    const root = fixture_root("AppRouter");
    const generated = join(root, "generated.ts");
    writeFileSync(generated, "generated");
    const removed: string[] = [];

    remove_next_preview_surface(
        {
            routePath: "/preview-run-a",
            router: "AppRouter",
            generatedFiles: [generated, generated],
        },
        (file) => removed.push(file),
    );

    expect(removed).toEqual([generated]);
});

afterAll(() => {
    for (const root of fixtureRoots) rmSync(root, { recursive: true, force: true });
});
