import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import {
    HARNESS_DIR,
    PROBE_TARGET_ID,
    harnessManifestSchema,
    type HarnessManifest,
    type ScaffoldInput,
    type ScaffoldOutput,
} from "./contract";
import { prepare_next_preview_runtime } from "./adapters/next/preview_runtime";

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
    if (!existsSync(path)) return { targets: [], warnings: [], rootLayoutMode: "inherit" };

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

export function scaffold(input: ScaffoldInput): ScaffoldOutput {
    const { workspaceRoot, detect: detected } = input;
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

    const previewRuntime = prepare_next_preview_runtime(workspaceRoot, appAbsoluteDir);
    const probeFile = join(harnessAbsoluteDir, "targets", `${PROBE_TARGET_ID}.tsx`);
    const routeFiles: string[] = [...previewRuntime.generatedFiles];
    if (!existsSync(probeFile)) {
        write_file(probeFile, PROBE_TARGET_SOURCE);
        routeFiles.push(to_posix(relative(workspaceRoot, probeFile)));
    }

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

    routeFiles.push(to_posix(relative(workspaceRoot, registryFile)));

    return { ok: true, routeFiles, warnings };
}
