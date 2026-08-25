import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

import {
    SAFE_ID,
    type NextApplicationRouter,
    type RootLayoutMode,
    type RootLayoutRestore,
} from "../../contract";

export interface PreviewSurface {
    routePath: string;
    generatedFiles: string[];
    router: NextApplicationRouter;
    rootLayoutMode: RootLayoutMode;
    rootLayoutRestore: RootLayoutRestore | null;
}

export interface CreateNextPreviewSurfaceInput {
    applicationPath: string;
    routeSegment: string;
    router: NextApplicationRouter;
    rootLayoutMode?: RootLayoutMode;
}

function to_posix(path: string): string {
    return path.split("\\").join("/");
}

function import_specifier(fromDir: string, toFile: string): string {
    const relativePath = to_posix(relative(fromDir, toFile)).replace(/\.tsx?$/, "");
    return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

function application_directory(workspaceRoot: string, applicationPath: string): string {
    if (!applicationPath || applicationPath.includes("\0")) {
        throw new Error("preview application path is invalid");
    }

    const workspaceDirectory = resolve(workspaceRoot);
    const applicationDirectory = resolve(workspaceDirectory, applicationPath);
    const applicationRelative = relative(workspaceDirectory, applicationDirectory);
    if (
        applicationRelative === ".." ||
        applicationRelative.startsWith("../") ||
        applicationRelative.startsWith("..\\")
    ) {
        throw new Error("preview application path escapes the workspace");
    }
    return applicationDirectory;
}

function route_directory(applicationDirectory: string, router: NextApplicationRouter): string {
    const candidates =
        router === "AppRouter"
            ? [join(applicationDirectory, "app"), join(applicationDirectory, "src", "app")]
            : [join(applicationDirectory, "pages"), join(applicationDirectory, "src", "pages")];
    const routeDirectory = candidates.find((candidate) => existsSync(candidate));
    if (!routeDirectory) {
        throw new Error(`selected ${router} directory was not found`);
    }
    return routeDirectory;
}

function root_layout_path(routeDirectory: string): string {
    const layoutPath = ["layout.tsx", "layout.jsx", "layout.ts", "layout.js"]
        .map((file) => join(routeDirectory, file))
        .find((file) => existsSync(file));
    if (!layoutPath) throw new Error("App Router root layout was not found for isolation");
    return layoutPath;
}

function stylesheet_imports(layoutSource: string): string[] {
    return Array.from(
        layoutSource.matchAll(
            /^\s*import\s+(?:(?:type\s+)?[^"']+\s+from\s+)?["'](?:\.{1,2}\/)[^"']+\.css["'];?\s*$/gm,
        ),
        (match) => match[0]!.trim(),
    );
}

function isolated_root_layout_source(imports: string[]): string {
    const stylesheetImports = imports.join("\n");
    return `import type { ReactNode } from "react";
${stylesheetImports ? `${stylesheetImports}\n` : ""}
export default function MatchaPreviewRootLayout({ children }: { children: ReactNode }) {
    return <html lang="en" data-matcha-preview-root-layout="true"><body>{children}</body></html>;
}
`;
}

function create_root_layout_isolation(
    applicationDirectory: string,
    routeDirectory: string,
    routeSegment: string,
): RootLayoutRestore {
    const layoutPath = root_layout_path(routeDirectory);
    const runtimeDirectory = join(applicationDirectory, ".matcha_preview_runtime", routeSegment);
    if (existsSync(runtimeDirectory)) {
        throw new Error(`preview layout runtime ${routeSegment} already exists`);
    }

    const backupPath = join(runtimeDirectory, `layout${extname(layoutPath)}`);
    const source = readFileSync(layoutPath, "utf8");
    mkdirSync(runtimeDirectory, { recursive: true });
    renameSync(layoutPath, backupPath);
    try {
        writeFileSync(layoutPath, isolated_root_layout_source(stylesheet_imports(source)), "utf8");
    } catch (error) {
        renameSync(backupPath, layoutPath);
        rmSync(runtimeDirectory, { recursive: true, force: true });
        throw error;
    }

    return { layoutPath, backupPath, generatedShellPath: layoutPath };
}

function restore_root_layout_isolation(restore: RootLayoutRestore): void {
    if (!existsSync(restore.backupPath)) return;
    rmSync(restore.generatedShellPath, { force: true });
    renameSync(restore.backupPath, restore.layoutPath);
    rmSync(dirname(restore.backupPath), { recursive: true, force: true });
}

function app_route_source(routeDirectory: string, registryFile: string): string {
    const registry = import_specifier(routeDirectory, registryFile);

    return `import { TARGETS } from "${registry}";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function MatchaPreviewPage({
    params,
    searchParams,
}: {
    params: Promise<{ targetId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { targetId } = await params;
    const query = await searchParams;
    const target = TARGETS[targetId];
    if (!target) {
        return <div data-matcha-harness-root>unknown target {targetId}</div>;
    }

    const requested = typeof query.state === "string" ? query.state : "";
    const stateId = target.states.includes(requested) ? requested : (target.states[0] ?? "default");
    const Component = target.component;

    return (
        <div data-matcha-harness-root style={{ width: "100%", background: "#fff" }}>
            <Component state={stateId} />
        </div>
    );
}
`;
}

function pages_route_source(routeDirectory: string, registryFile: string): string {
    const registry = import_specifier(routeDirectory, registryFile);

    return `import { TARGETS } from "${registry}";

export function getServerSideProps(context: {
    params?: { targetId?: string };
    query: Record<string, string | string[] | undefined>;
}) {
    const targetId = String(context.params?.targetId ?? "");
    const state = typeof context.query.state === "string" ? context.query.state : "";
    return { props: { targetId, state } };
}

export default function MatchaPreviewPage({ targetId, state }: { targetId: string; state: string }) {
    const target = TARGETS[targetId];
    if (!target) {
        return <div data-matcha-harness-root>unknown target {targetId}</div>;
    }

    const stateId = target.states.includes(state) ? state : (target.states[0] ?? "default");
    const Component = target.component;

    return (
        <div data-matcha-harness-root style={{ width: "100%", background: "#fff" }}>
            <Component state={stateId} />
        </div>
    );
}
`;
}

export function create_next_preview_surface(
    workspaceRoot: string,
    input: CreateNextPreviewSurfaceInput,
): PreviewSurface {
    if (!SAFE_ID.test(input.routeSegment)) {
        throw new Error("preview route segment is invalid");
    }

    const rootLayoutMode = input.rootLayoutMode ?? "inherit";
    const applicationDirectory = application_directory(workspaceRoot, input.applicationPath);
    const routeRoot = route_directory(applicationDirectory, input.router);
    const surfaceRoot = join(routeRoot, input.routeSegment);
    if (existsSync(surfaceRoot)) {
        throw new Error(`preview route ${input.routeSegment} already exists`);
    }

    const registryFile = join(applicationDirectory, "matcha_preview", "registry.ts");
    if (!existsSync(registryFile)) {
        throw new Error("preview harness registry was not found");
    }
    if (rootLayoutMode === "isolate" && input.router !== "AppRouter") {
        throw new Error("Pages Router does not support root layout isolation");
    }

    const routeDirectory =
        input.router === "AppRouter" ? join(surfaceRoot, "[targetId]") : surfaceRoot;
    const pageFile =
        input.router === "AppRouter"
            ? join(routeDirectory, "page.tsx")
            : join(routeDirectory, "[targetId].tsx");
    let rootLayoutRestore: RootLayoutRestore | null = null;
    try {
        if (rootLayoutMode === "isolate") {
            rootLayoutRestore = create_root_layout_isolation(
                applicationDirectory,
                routeRoot,
                input.routeSegment,
            );
        }
        mkdirSync(routeDirectory, { recursive: true });
        writeFileSync(
            pageFile,
            input.router === "AppRouter"
                ? app_route_source(routeDirectory, registryFile)
                : pages_route_source(routeDirectory, registryFile),
            "utf8",
        );
    } catch (error) {
        rmSync(surfaceRoot, { recursive: true, force: true });
        if (rootLayoutRestore) restore_root_layout_isolation(rootLayoutRestore);
        throw error;
    }

    return {
        routePath: `/${input.routeSegment}`,
        generatedFiles: [pageFile],
        router: input.router,
        rootLayoutMode,
        rootLayoutRestore,
    };
}

export function remove_next_preview_surface(
    surface: PreviewSurface,
    removeFile: (path: string) => void = (path) => rmSync(path, { force: true }),
): void {
    for (const file of [...new Set(surface.generatedFiles)].sort(
        (left, right) => right.split(/[\\/]/).length - left.split(/[\\/]/).length,
    )) {
        removeFile(file);
    }
    if (surface.rootLayoutRestore) restore_root_layout_isolation(surface.rootLayoutRestore);
}
