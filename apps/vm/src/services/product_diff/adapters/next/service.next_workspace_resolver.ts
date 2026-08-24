import type { ProductDiffDiagnostic, ProductDiffPreviewConfiguration } from "@trymatcha/types";

import type { ProductDiffWorkspacePlan } from "../../adapter.contract";
import type {
    NextApplicationCandidate,
    NextWorkspaceInspection,
} from "../../../service.preview_runner";

function normalized_path(path: string): string {
    return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

function path_is_in_application(path: string, applicationPath: string): boolean {
    if (applicationPath === ".") return path.length > 0;
    return path === applicationPath || path.startsWith(`${applicationPath}/`);
}

function changed_applications(
    inspection: NextWorkspaceInspection,
    changedPaths: string[],
): NextApplicationCandidate[] {
    const applicationPaths = new Set<string>();
    for (const changedPath of changedPaths.map(normalized_path)) {
        for (const application of inspection.applications) {
            if (path_is_in_application(changedPath, application.applicationPath)) {
                applicationPaths.add(application.applicationPath);
            }
        }
    }
    return inspection.applications.filter((application) =>
        applicationPaths.has(application.applicationPath),
    );
}

function diagnostic(
    code: string,
    message: string,
    inspection: NextWorkspaceInspection,
    applicationPath: string | null = null,
): ProductDiffDiagnostic {
    return {
        code,
        stage: "workspace-resolution",
        message,
        adapter: "next",
        applicationPath,
        workspaceKind: inspection.workspaceKind,
    };
}

function package_command(
    packageManager: NonNullable<NextWorkspaceInspection["packageManager"]>,
): string {
    return packageManager;
}

function directory_launch_command(
    packageManager: NonNullable<NextWorkspaceInspection["packageManager"]>,
    applicationPath: string,
): string {
    if (applicationPath === ".") return `${package_command(packageManager)} run dev`;
    switch (packageManager) {
        case "bun":
            return `bun --cwd ${applicationPath} run dev`;
        case "pnpm":
            return `pnpm --dir ${applicationPath} run dev`;
        case "yarn":
            return `yarn --cwd ${applicationPath} dev`;
        case "npm":
            return `npm --prefix ${applicationPath} run dev`;
    }
}

function turbo_launch_command(
    packageManager: NonNullable<NextWorkspaceInspection["packageManager"]>,
    application: NextApplicationCandidate,
): string {
    if (!application.packageName) {
        return directory_launch_command(packageManager, application.applicationPath);
    }
    switch (packageManager) {
        case "bun":
            return `bun run --filter ${application.packageName} dev`;
        case "pnpm":
            return `pnpm --filter ${application.packageName} run dev`;
        case "yarn":
            return `yarn workspace ${application.packageName} dev`;
        case "npm":
            return `npm run --workspace ${application.packageName} dev`;
    }
}

function nx_launch_command(
    packageManager: NonNullable<NextWorkspaceInspection["packageManager"]>,
    application: NextApplicationCandidate,
): string {
    const project = application.packageName ?? application.applicationPath;
    switch (packageManager) {
        case "bun":
            return `bun nx run ${project}:dev`;
        case "pnpm":
            return `pnpm nx run ${project}:dev`;
        case "yarn":
            return `yarn nx run ${project}:dev`;
        case "npm":
            return `npm exec nx run ${project}:dev`;
    }
}

function launch_command(
    inspection: NextWorkspaceInspection,
    application: NextApplicationCandidate,
): string {
    const packageManager = inspection.packageManager!;
    switch (inspection.workspaceKind) {
        case "Standalone":
            return directory_launch_command(packageManager, application.applicationPath);
        case "Turborepo":
            return turbo_launch_command(packageManager, application);
        case "PnpmWorkspace":
            return turbo_launch_command(packageManager, application);
        case "Nx":
            return nx_launch_command(packageManager, application);
    }
}

export function resolve_next_workspace(
    inspection: NextWorkspaceInspection,
    changedPaths: string[],
    configuration: ProductDiffPreviewConfiguration | null,
): ProductDiffWorkspacePlan | ProductDiffDiagnostic {
    if (inspection.applications.length === 0) {
        return diagnostic(
            "NEXT_APPLICATION_NOT_FOUND",
            "No inspected Next.js application can be resolved.",
            inspection,
        );
    }
    if (!inspection.packageManager) {
        return diagnostic(
            "PACKAGE_MANAGER_NOT_FOUND",
            "No root package-manager lockfile was found.",
            inspection,
        );
    }

    const configuredPath = configuration?.applicationPath
        ? normalized_path(configuration.applicationPath)
        : null;
    const application = configuredPath
        ? (inspection.applications.find(
              (candidate) => candidate.applicationPath === configuredPath,
          ) ?? null)
        : (() => {
              const changed = changed_applications(inspection, changedPaths);
              if (changed.length === 1) return changed[0]!;
              if (changed.length === 0 && inspection.applications.length === 1) {
                  return inspection.applications[0]!;
              }
              return null;
          })();

    if (configuredPath && !application) {
        return diagnostic(
            "APPLICATION_PATH_NOT_FOUND",
            `Configured application path ${configuredPath} is not an inspected Next.js application.`,
            inspection,
            configuredPath,
        );
    }
    if (!application) {
        return diagnostic(
            "APPLICATION_SELECTION_AMBIGUOUS",
            "Changed paths do not identify exactly one Next.js application.",
            inspection,
        );
    }

    return {
        repositoryRoot: ".",
        applicationPath: application.applicationPath,
        workspaceKind: inspection.workspaceKind,
        installDirectory: ".",
        launchCommand: configuration?.launchCommand ?? launch_command(inspection, application),
        healthPath: configuration?.healthPath ?? "/",
        router: application.router,
        framework: application.router === "AppRouter" ? "NextAppRouter" : "NextPagesRouter",
        dependency: {
            packageManager: inspection.packageManager,
            lockfileRelPath: "",
            lockfileSha256: "",
            workspaceDirs: [],
        },
    };
}
