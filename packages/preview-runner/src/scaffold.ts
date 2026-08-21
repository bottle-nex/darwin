import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import {
    HARNESS_DIR,
    HARNESS_ROOT_ATTRIBUTE,
    PREVIEW_ROUTE_SEGMENT,
    PROBE_TARGET_ID,
    harnessManifestSchema,
    type HarnessManifest,
    type ScaffoldInput,
    type ScaffoldOutput,
} from "./contract";

const PROBE_TARGET_SOURCE = `export default function Target() {
    return <span>ok</span>;
}
`;

function to_posix(path: string): string {
    return path.split("\\").join("/");
}

function import_specifier(fromDir: string, toFile: string): string {
    const relativePath = to_posix(relative(fromDir, toFile)).replace(/\.tsx?$/, "");
    return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

function identifier(targetId: string): string {
    return `Target_${targetId.replace(/-/g, "_")}`;
}

function write_file(absolute: string, contents: string): void {
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, contents, "utf8");
}

/**
 * Reads the target list the harness agent wrote, tolerating it not existing yet.
 *
 * Scaffolding runs once before the agent has written anything — that early run is what lets the
 * dev server boot and answer the probe — so a missing file is normal, not an error.
 *
 * @example
 * read_harness_manifest("/home/user/workspace/head/apps/web");
 * // { targets: [{ id: "header-nav", ... }], warnings: [] }  — or an empty manifest
 */
export function read_harness_manifest(appAbsoluteDir: string): HarnessManifest {
    const path = join(appAbsoluteDir, HARNESS_DIR, "manifest.json");
    if (!existsSync(path)) return { targets: [], warnings: [] };

    return harnessManifestSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

function registry_source(appAbsoluteDir: string, targets: HarnessManifest["targets"]): string {
    const registryDir = join(appAbsoluteDir, HARNESS_DIR);
    const imports = targets.map(
        (target) =>
            `import ${identifier(target.id)} from "${import_specifier(
                registryDir,
                join(registryDir, "targets", `${target.id}.tsx`),
            )}";`,
    );
    const entries = targets.map(
        (target) =>
            `    ${JSON.stringify(target.id)}: { component: ${identifier(target.id)}, states: ${JSON.stringify(
                target.states.map((state) => state.id),
            )} },`,
    );

    return `import type { ComponentType } from "react";
${imports.join("\n")}

export type PreviewTarget = { component: ComponentType<{ state: string }>; states: string[] };

export const TARGETS: Record<string, PreviewTarget> = {
${entries.join("\n")}
};
`;
}

function app_route_source(
    routeAbsoluteDir: string,
    registryFile: string,
    nextMajor: number,
): string {
    const registry = import_specifier(routeAbsoluteDir, registryFile);
    const asyncProps = nextMajor >= 15;

    const signature = asyncProps
        ? `{ params, searchParams }: { params: Promise<{ targetId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }`
        : `{ params, searchParams }: { params: { targetId: string }; searchParams: Record<string, string | string[] | undefined> }`;
    const resolve = asyncProps
        ? `    const { targetId } = await params;\n    const query = await searchParams;`
        : `    const { targetId } = params;\n    const query = searchParams;`;

    return `import { TARGETS } from "${registry}";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function MatchaPreviewPage(${signature}) {
${resolve}
    const target = TARGETS[targetId];
    if (!target) {
        return <div ${HARNESS_ROOT_ATTRIBUTE}>unknown target {targetId}</div>;
    }

    const requested = typeof query.state === "string" ? query.state : "";
    const stateId = target.states.includes(requested) ? requested : (target.states[0] ?? "default");
    const Component = target.component;

    return (
        <div ${HARNESS_ROOT_ATTRIBUTE} style={{ width: "100%", background: "#fff" }}>
            <Component state={stateId} />
        </div>
    );
}
`;
}

function pages_route_source(routeAbsoluteDir: string, registryFile: string): string {
    const registry = import_specifier(routeAbsoluteDir, registryFile);

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
        return <div ${HARNESS_ROOT_ATTRIBUTE}>unknown target {targetId}</div>;
    }

    const stateId = target.states.includes(state) ? state : (target.states[0] ?? "default");
    const Component = target.component;

    return (
        <div ${HARNESS_ROOT_ATTRIBUTE} style={{ width: "100%", background: "#fff" }}>
            <Component state={stateId} />
        </div>
    );
}
`;
}

function pages_app_source(appFileDir: string, stylesheetAbsolute: string | null): string {
    const stylesheet = stylesheetAbsolute
        ? `import "${import_specifier(appFileDir, stylesheetAbsolute)}";\n`
        : "";

    return `import type { AppProps } from "next/app";
${stylesheet}
export default function MatchaPreviewApp({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
`;
}

/**
 * Turns the agent's target components into pages a browser can actually open.
 *
 * The pipeline owns this step, never the agent — which is what makes it safe to run the very
 * same generation against the base revision, where the agent never ran. It is idempotent, so
 * re-running it after the agent adds a target is all that is needed to pick the target up.
 *
 * @example
 * scaffold({ workspaceRoot: "/home/user/workspace/head", detect, mode: "AppRoute" });
 * // writes apps/web/app/matcha-preview/[targetId]/page.tsx and apps/web/matcha_preview/registry.ts
 */
export function scaffold(input: ScaffoldInput): ScaffoldOutput {
    const { workspaceRoot, detect: detected, mode } = input;
    const warnings: string[] = [...detected.warnings];

    if (!detected.supported || !detected.nextAppDir || !detected.routeDir || !detected.framework) {
        return {
            ok: false,
            routeFiles: [],
            warnings: [detected.reason ?? "workspace is not supported"],
        };
    }

    const appAbsoluteDir = join(workspaceRoot, detected.nextAppDir);
    const harnessAbsoluteDir = join(appAbsoluteDir, HARNESS_DIR);

    const probeFile = join(harnessAbsoluteDir, "targets", `${PROBE_TARGET_ID}.tsx`);
    if (!existsSync(probeFile)) write_file(probeFile, PROBE_TARGET_SOURCE);

    const manifest = read_harness_manifest(appAbsoluteDir);
    const present = manifest.targets.filter((target) => {
        const file = join(harnessAbsoluteDir, "targets", `${target.id}.tsx`);
        if (existsSync(file)) return true;
        warnings.push(`target ${target.id} is in the manifest but has no target file`);
        return false;
    });

    const targets: HarnessManifest["targets"] = [
        ...present,
        {
            id: PROBE_TARGET_ID,
            label: "Probe",
            sourcePath: "-",
            states: [{ id: "default", label: "Default" }],
        },
    ];

    const registryFile = join(harnessAbsoluteDir, "registry.ts");
    write_file(registryFile, registry_source(appAbsoluteDir, targets));

    const routeFiles: string[] = [to_posix(relative(workspaceRoot, registryFile))];
    const usePagesEscape = mode === "PagesEscape";

    if (detected.framework === "NextAppRouter" && !usePagesEscape) {
        const routeDir = join(
            workspaceRoot,
            detected.routeDir,
            PREVIEW_ROUTE_SEGMENT,
            "[targetId]",
        );
        const pageFile = join(routeDir, "page.tsx");
        write_file(pageFile, app_route_source(routeDir, registryFile, detected.nextMajor ?? 15));
        routeFiles.push(to_posix(relative(workspaceRoot, pageFile)));
    } else {
        const pagesRoot = usePagesEscape
            ? join(appAbsoluteDir, "pages")
            : join(workspaceRoot, detected.routeDir);
        const routeDir = join(pagesRoot, PREVIEW_ROUTE_SEGMENT);
        const pageFile = join(routeDir, "[targetId].tsx");
        write_file(pageFile, pages_route_source(routeDir, registryFile));
        routeFiles.push(to_posix(relative(workspaceRoot, pageFile)));

        const appFile = join(pagesRoot, "_app.tsx");
        if (usePagesEscape && !existsSync(appFile)) {
            const stylesheet = detected.globalStylesheet
                ? join(workspaceRoot, detected.globalStylesheet)
                : null;
            write_file(appFile, pages_app_source(pagesRoot, stylesheet));
            routeFiles.push(to_posix(relative(workspaceRoot, appFile)));
            warnings.push("root layout could not render, so targets are mounted without it");
        }
    }

    return { ok: true, routeFiles, warnings };
}

/**
 * Removes the generated route files, leaving the agent's target components untouched.
 *
 * Used when switching a revision from mounting inside the root layout to bypassing it, so the
 * abandoned route tree cannot keep answering requests.
 *
 * @example
 * clear_scaffold("/home/user/workspace/head", ["apps/web/app/matcha-preview/[targetId]/page.tsx"]);
 */
export function clear_scaffold(workspaceRoot: string, routeFiles: string[]): void {
    for (const file of routeFiles) {
        rmSync(join(workspaceRoot, file), { force: true });
    }
}
