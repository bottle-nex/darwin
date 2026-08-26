import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    realpathSync,
    writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, sep } from "node:path";

const RIVE_REACT_CANVAS_PACKAGE = "@rive-app/react-canvas";
const RIVE_CANVAS_PACKAGE = "@rive-app/canvas";
const RIVE_PUBLIC_PATH = "/matcha-preview-runtime/rive/rive.wasm";

export interface PreparedNextPreviewRuntime {
    generatedFiles: string[];
}

function to_posix(path: string): string {
    return path.split("\\").join("/");
}

function contained_real_path(workspaceRoot: string, candidate: string): string | null {
    try {
        const workspace = realpathSync(workspaceRoot);
        const resolved = realpathSync(candidate);
        const workspaceRelativePath = relative(workspace, resolved);
        if (
            workspaceRelativePath === ".." ||
            workspaceRelativePath.startsWith(`..${sep}`) ||
            isAbsolute(workspaceRelativePath)
        ) {
            return null;
        }
        return resolved;
    } catch {
        return null;
    }
}

function resolve_package_manifest(
    workspaceRoot: string,
    applicationDirectory: string,
    packageName: string,
): string | null {
    try {
        const manifest = createRequire(join(applicationDirectory, "package.json")).resolve(
            `${packageName}/package.json`,
        );
        return contained_real_path(workspaceRoot, manifest);
    } catch {
        return null;
    }
}

function resolve_rive_runtime(
    workspaceRoot: string,
    applicationDirectory: string,
): {
    packageName: string;
    wasmPath: string;
} | null {
    const reactCanvasManifest = resolve_package_manifest(
        workspaceRoot,
        applicationDirectory,
        RIVE_REACT_CANVAS_PACKAGE,
    );
    if (reactCanvasManifest) {
        try {
            const wasmPath = contained_real_path(
                workspaceRoot,
                createRequire(reactCanvasManifest).resolve(`${RIVE_CANVAS_PACKAGE}/rive.wasm`),
            );
            if (!wasmPath) return null;
            return {
                packageName: RIVE_REACT_CANVAS_PACKAGE,
                wasmPath,
            };
        } catch {
            return null;
        }
    }

    const canvasManifest = resolve_package_manifest(
        workspaceRoot,
        applicationDirectory,
        RIVE_CANVAS_PACKAGE,
    );
    if (!canvasManifest) return null;

    try {
        const wasmPath = contained_real_path(
            workspaceRoot,
            createRequire(canvasManifest).resolve(`${RIVE_CANVAS_PACKAGE}/rive.wasm`),
        );
        if (!wasmPath) return null;
        return {
            packageName: RIVE_CANVAS_PACKAGE,
            wasmPath,
        };
    } catch {
        return null;
    }
}

function runtime_source(rivePackageName: string | null): string {
    if (!rivePackageName) {
        return `import type { ReactNode } from "react";

export default function MatchaPreviewRuntime({ children }: { children: ReactNode }) {
    return children;
}
`;
    }

    return `"use client";

import type { ReactNode } from "react";
import { RuntimeLoader } from "${rivePackageName}";

RuntimeLoader.setWasmUrl("${RIVE_PUBLIC_PATH}");

export default function MatchaPreviewRuntime({ children }: { children: ReactNode }) {
    return children;
}
`;
}

function write_runtime_asset(source: string, destination: string): void {
    if (existsSync(destination) && !readFileSync(destination).equals(readFileSync(source))) {
        throw new Error(`preview runtime asset already exists at ${destination}`);
    }
    mkdirSync(dirname(destination), { recursive: true });
    if (!existsSync(destination)) copyFileSync(source, destination);
}

export function prepare_next_preview_runtime(
    workspaceRoot: string,
    applicationDirectory: string,
): PreparedNextPreviewRuntime {
    if (!contained_real_path(workspaceRoot, applicationDirectory)) {
        throw new Error(
            `preview application directory is outside the workspace: ${applicationDirectory}`,
        );
    }
    const runtimeFile = join(applicationDirectory, "matcha_preview", "PreviewRuntime.tsx");
    const riveRuntime = resolve_rive_runtime(workspaceRoot, applicationDirectory);
    const generatedFiles = [to_posix(relative(workspaceRoot, runtimeFile))];

    mkdirSync(dirname(runtimeFile), { recursive: true });
    writeFileSync(runtimeFile, runtime_source(riveRuntime?.packageName ?? null), "utf8");

    if (riveRuntime) {
        const assetFile = join(
            applicationDirectory,
            "public",
            "matcha-preview-runtime",
            "rive",
            "rive.wasm",
        );
        write_runtime_asset(riveRuntime.wasmPath, assetFile);
        generatedFiles.push(to_posix(relative(workspaceRoot, assetFile)));
    }

    return { generatedFiles };
}
