import { afterAll, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    writeFileSync(
        join(applicationRoot, "matcha_preview", "PreviewRuntime.tsx"),
        "export default function MatchaPreviewRuntime({ children }: { children: React.ReactNode }) { return children; }\n",
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

test("loads the preview runtime before mounting the selected target", () => {
    const root = fixture_root("AppRouter");

    const surface = create_next_preview_surface(root, {
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
    });

    const routeSource = readFileSync(surface.generatedFiles[0]!, "utf8");
    expect(routeSource).toContain(
        'import MatchaPreviewRuntime from "../../../matcha_preview/PreviewRuntime";',
    );
    expect(routeSource).toContain(
        "<MatchaPreviewRuntime><Component state={stateId} /></MatchaPreviewRuntime>",
    );
});

test("isolates an App Router root layout and restores it byte-for-byte", () => {
    const root = fixture_root("AppRouter");
    const layoutFile = join(root, "apps/web/app/layout.tsx");
    const originalLayout = `import "./globals.css";
import MissingProvider from "./MissingProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <MissingProvider>{children}</MissingProvider>;
}
`;
    writeFileSync(layoutFile, originalLayout);

    const surface = create_next_preview_surface(root, {
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
        rootLayoutMode: "isolate",
    });

    const isolatedLayout = readFileSync(layoutFile, "utf8");
    expect(surface).toMatchObject({ rootLayoutMode: "isolate" });
    expect(isolatedLayout).toContain('import "./globals.css";');
    expect(isolatedLayout).not.toContain("MissingProvider");

    remove_next_preview_surface(surface);

    expect(readFileSync(layoutFile, "utf8")).toBe(originalLayout);
});

test("removes an isolated App Router route before retrying the same route with inheritance", () => {
    const root = fixture_root("AppRouter");
    const layoutFile = join(root, "apps/web/app/layout.tsx");
    const originalLayout = `import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <html><body>{children}</body></html>;
}
`;
    writeFileSync(layoutFile, originalLayout);

    const isolated = create_next_preview_surface(root, {
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
        rootLayoutMode: "isolate",
    });

    remove_next_preview_surface(isolated);

    const inherited = create_next_preview_surface(root, {
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
        rootLayoutMode: "inherit",
    });

    expect(readFileSync(layoutFile, "utf8")).toBe(originalLayout);
    expect(existsSync(inherited.generatedFiles[0]!)).toBe(true);
});

test("rejects Pages Router isolation before creating a preview route", () => {
    const root = fixture_root("PagesRouter");
    const routePath = join(root, "apps/web/pages/preview-run-a");

    expect(() =>
        create_next_preview_surface(root, {
            applicationPath: "apps/web",
            routeSegment: "preview-run-a",
            router: "PagesRouter",
            rootLayoutMode: "isolate",
        }),
    ).toThrow("Pages Router does not support root layout isolation");
    expect(existsSync(routePath)).toBe(false);
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
            rootLayoutMode: "inherit",
            rootLayoutRestore: null,
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
            rootLayoutMode: "inherit",
            rootLayoutRestore: null,
        },
        (file) => removed.push(file),
    );

    expect(removed).toEqual([generated]);
});

afterAll(() => {
    for (const root of fixtureRoots) rmSync(root, { recursive: true, force: true });
});
