import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import type {
    NextApplicationCandidate,
    NextApplicationRouter,
    NextWorkspaceInspection,
    NextWorkspaceInspectionInput,
    NextWorkspaceKind,
    PackageManager,
} from "../../contract";

const IGNORED_DIRECTORIES = new Set([
    "node_modules",
    ".git",
    ".next",
    ".turbo",
    "dist",
    "build",
    "coverage",
    ".vercel",
]);

const ROOT_LOCKFILES: readonly { file: string; packageManager: PackageManager }[] = [
    { file: "bun.lock", packageManager: "bun" },
    { file: "bun.lockb", packageManager: "bun" },
    { file: "pnpm-lock.yaml", packageManager: "pnpm" },
    { file: "yarn.lock", packageManager: "yarn" },
    { file: "package-lock.json", packageManager: "npm" },
];

function is_directory(path: string): boolean {
    try {
        return lstatSync(path).isDirectory();
    } catch {
        return false;
    }
}

function read_package_manifest(path: string): Record<string, unknown> | null {
    try {
        const parsed = JSON.parse(readFileSync(path, "utf8"));
        return parsed !== null && typeof parsed === "object"
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}

function package_directories(root: string): string[] {
    const found: string[] = [];
    const visit = (directory: string) => {
        if (existsSync(join(directory, "package.json"))) {
            found.push(relative(root, directory).split(sep).join("/") || ".");
        }

        let entries: string[];
        try {
            entries = readdirSync(directory);
        } catch {
            return;
        }

        for (const entry of entries) {
            if (IGNORED_DIRECTORIES.has(entry)) continue;
            const child = join(directory, entry);
            if (is_directory(child)) visit(child);
        }
    };

    visit(root);
    return found.sort((left, right) => left.localeCompare(right));
}

function next_dependency(manifest: Record<string, unknown>): boolean {
    return ["dependencies", "devDependencies"].some((field) => {
        const dependencies = manifest[field];
        return (
            dependencies !== null &&
            typeof dependencies === "object" &&
            "next" in dependencies &&
            typeof (dependencies as Record<string, unknown>).next === "string"
        );
    });
}

function application_path(packageDirectory: string, candidate: string): string {
    return packageDirectory === "." ? candidate : `${packageDirectory}/${candidate}`;
}

function application_router(
    root: string,
    packageDirectory: string,
): {
    router: NextApplicationRouter;
    hasPagesDirectory: boolean;
} | null {
    const hasAppDirectory = ["app", "src/app"].some((candidate) =>
        is_directory(join(root, application_path(packageDirectory, candidate))),
    );
    const hasPagesDirectory = ["pages", "src/pages"].some((candidate) =>
        is_directory(join(root, application_path(packageDirectory, candidate))),
    );

    if (hasAppDirectory) return { router: "AppRouter", hasPagesDirectory };
    if (hasPagesDirectory) return { router: "PagesRouter", hasPagesDirectory };
    return null;
}

function workspace_kind(root: string): NextWorkspaceKind {
    if (
        existsSync(join(root, "nx.json")) ||
        existsSync(join(root, "workspace.json")) ||
        existsSync(join(root, "project.json"))
    ) {
        return "Nx";
    }
    if (existsSync(join(root, "turbo.json"))) return "Turborepo";
    if (existsSync(join(root, "pnpm-workspace.yaml"))) return "PnpmWorkspace";
    return "Standalone";
}

function package_manager(root: string): PackageManager | null {
    return ROOT_LOCKFILES.find(({ file }) => existsSync(join(root, file)))?.packageManager ?? null;
}

function normalized_path(path: string): string {
    return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

function path_is_in_application(path: string, applicationPath: string): boolean {
    if (applicationPath === ".") return path.length > 0;
    return path === applicationPath || path.startsWith(`${applicationPath}/`);
}

function changed_application_paths(
    applications: NextApplicationCandidate[],
    changedPaths: string[],
): string[] {
    const selected = new Set<string>();
    for (const changedPath of changedPaths.map(normalized_path)) {
        for (const application of applications) {
            if (path_is_in_application(changedPath, application.applicationPath)) {
                selected.add(application.applicationPath);
            }
        }
    }
    return [...selected].sort((left, right) => left.localeCompare(right));
}

export function inspect_next_workspace(
    input: NextWorkspaceInspectionInput,
): NextWorkspaceInspection;
export function inspect_next_workspace(
    workspaceRoot: string,
    changedPaths: string[],
): NextWorkspaceInspection;
export function inspect_next_workspace(
    inputOrWorkspaceRoot: NextWorkspaceInspectionInput | string,
    changedPaths: string[] = [],
): NextWorkspaceInspection {
    const { workspaceRoot, changedPaths: inspectedChangedPaths } =
        typeof inputOrWorkspaceRoot === "string"
            ? { workspaceRoot: inputOrWorkspaceRoot, changedPaths }
            : inputOrWorkspaceRoot;

    if (!is_directory(workspaceRoot)) {
        return {
            workspaceKind: "Standalone",
            packageManager: null,
            applications: [],
            changedApplicationPaths: [],
        };
    }

    const applications = package_directories(workspaceRoot)
        .map((packageDirectory) => {
            const manifest = read_package_manifest(
                join(
                    workspaceRoot,
                    packageDirectory === "." ? "package.json" : `${packageDirectory}/package.json`,
                ),
            );
            const router = manifest ? application_router(workspaceRoot, packageDirectory) : null;
            if (!manifest || !next_dependency(manifest) || !router) return null;
            return {
                applicationPath: packageDirectory,
                packageName: typeof manifest.name === "string" ? manifest.name : null,
                router: router.router,
                hasPagesDirectory: router.hasPagesDirectory,
            } satisfies NextApplicationCandidate;
        })
        .filter((application): application is NextApplicationCandidate => application !== null);

    return {
        workspaceKind: workspace_kind(workspaceRoot),
        packageManager: package_manager(workspaceRoot),
        applications,
        changedApplicationPaths: changed_application_paths(applications, inspectedChangedPaths),
    };
}
