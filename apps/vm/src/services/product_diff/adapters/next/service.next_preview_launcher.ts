import type { ProductDiffWorkspacePlan } from "../../adapter.contract";
import type { NextWorkspaceKind, PackageManager } from "../../../service.preview_runner";

const SAFE_SHELL_ARGUMENT = /^[A-Za-z0-9_@%+=:,./-]+$/;
const SAFE_OVERRIDE = /^[A-Za-z0-9_@%+=:,./ -]+$/;
const PACKAGE_MANAGERS = new Set<PackageManager>(["bun", "pnpm", "yarn", "npm"]);
const WORKSPACE_KINDS = new Set<NextWorkspaceKind>([
    "Standalone",
    "PnpmWorkspace",
    "Turborepo",
    "Nx",
]);

export interface NextPreviewLaunchPlan {
    command: string;
    workingDirectory: string;
    port: number;
    healthPath: string;
    environment: Record<string, string>;
}

export interface NextPreviewLaunchInput {
    workspaceKind: NextWorkspaceKind;
    packageManager: PackageManager;
    packageName?: string | null;
    applicationPath: string;
    port: number;
    workspaceRoot?: string;
    healthPath?: string;
    environment?: Record<string, string>;
    launchCommand?: string;
}

function shell_argument(value: string): string {
    if (SAFE_SHELL_ARGUMENT.test(value)) return value;
    return `'${value.replaceAll("'", "'\\\"'\\\"'")}'`;
}

function valid_port(port: number): boolean {
    return Number.isInteger(port) && port >= 1 && port <= 65_535;
}

function valid_health_path(healthPath: string): boolean {
    return healthPath.startsWith("/") && !healthPath.includes("\n") && !healthPath.includes("\r");
}

function has_network_binding_argument(command: string): boolean {
    return /(?:^|\s)(?:--(?:hostname|host|port)(?:=|\s|$)|-p(?:\d+)?(?:\s|$))/.test(command);
}

function append_network_arguments(
    command: string,
    workspaceKind: NextWorkspaceKind,
    port: number,
): string {
    if (workspaceKind === "Nx") {
        return `${command} -- --host=127.0.0.1 --port=${port}`;
    }
    return `${command} -- --hostname 127.0.0.1 --port ${port}`;
}

function standalone_command(packageManager: PackageManager, applicationPath: string): string {
    const path = shell_argument(applicationPath);
    switch (packageManager) {
        case "bun":
            return `bun --cwd ${path} run dev`;
        case "pnpm":
            return `pnpm --dir ${path} run dev`;
        case "yarn":
            return `yarn --cwd ${path} dev`;
        case "npm":
            return `npm --prefix ${path} run dev`;
    }
}

function workspace_command(
    packageManager: PackageManager,
    packageName: string | null | undefined,
    applicationPath: string,
): string {
    if (!packageName) return standalone_command(packageManager, applicationPath);

    const packageArgument = shell_argument(packageName);
    switch (packageManager) {
        case "bun":
            return `bun run --filter ${packageArgument} dev`;
        case "pnpm":
            return `pnpm --filter ${packageArgument} run dev`;
        case "yarn":
            return `yarn workspace ${packageArgument} dev`;
        case "npm":
            return `npm run --workspace ${packageArgument} dev`;
    }
}

function nx_command(
    packageManager: PackageManager,
    packageName: string | null | undefined,
    applicationPath: string,
): string {
    const target = shell_argument(`${packageName ?? applicationPath}:serve`);
    switch (packageManager) {
        case "bun":
            return `bun nx run ${target}`;
        case "pnpm":
            return `pnpm nx run ${target}`;
        case "yarn":
            return `yarn nx run ${target}`;
        case "npm":
            return `npm exec nx run ${target}`;
    }
}

function known_command(input: NextPreviewLaunchInput): string {
    switch (input.workspaceKind) {
        case "Standalone":
            return standalone_command(input.packageManager, input.applicationPath);
        case "PnpmWorkspace":
        case "Turborepo":
            return workspace_command(
                input.packageManager,
                input.packageName,
                input.applicationPath,
            );
        case "Nx":
            return nx_command(input.packageManager, input.packageName, input.applicationPath);
    }
}

export default class NextPreviewLauncher {
    static validate_override(command: string): string {
        const normalized = command.trim();
        if (!normalized || !SAFE_OVERRIDE.test(normalized)) {
            throw new Error("preview launch command contains unsupported shell syntax");
        }

        const executable = normalized.split(/\s+/, 1)[0]!;
        if (!PACKAGE_MANAGERS.has(executable as PackageManager)) {
            throw new Error("preview launch command must start with a supported package manager");
        }
        if (has_network_binding_argument(normalized)) {
            throw new Error("preview launch command cannot set its own host or port");
        }
        return normalized;
    }

    static create(input: NextPreviewLaunchInput): NextPreviewLaunchPlan {
        if (!WORKSPACE_KINDS.has(input.workspaceKind)) {
            throw new Error("preview launch command has an unsupported workspace kind");
        }
        if (!PACKAGE_MANAGERS.has(input.packageManager)) {
            throw new Error("preview launch command has an unsupported package manager");
        }
        if (!input.applicationPath || input.applicationPath.includes("\0")) {
            throw new Error("preview launch command has an invalid application path");
        }
        if (!valid_port(input.port)) {
            throw new Error("preview launch command has an invalid port");
        }

        const healthPath = input.healthPath ?? "/";
        if (!valid_health_path(healthPath)) {
            throw new Error("preview launch command has an invalid health path");
        }

        const command = input.launchCommand
            ? this.validate_override(input.launchCommand)
            : known_command(input);
        return {
            command: append_network_arguments(command, input.workspaceKind, input.port),
            workingDirectory: input.workspaceRoot ?? ".",
            port: input.port,
            healthPath,
            environment: { ...input.environment },
        };
    }

    static from_workspace_plan(input: {
        workspaceRoot: string;
        workspacePlan: ProductDiffWorkspacePlan;
        port: number;
        environment?: Record<string, string>;
    }): NextPreviewLaunchPlan {
        if (!WORKSPACE_KINDS.has(input.workspacePlan.workspaceKind as NextWorkspaceKind)) {
            throw new Error("preview launch plan has an unsupported workspace kind");
        }

        const workspaceKind = input.workspacePlan.workspaceKind as NextWorkspaceKind;
        if (!valid_port(input.port)) {
            throw new Error("preview launch plan has an invalid port");
        }
        if (!valid_health_path(input.workspacePlan.healthPath)) {
            throw new Error("preview launch plan has an invalid health path");
        }

        return {
            command: append_network_arguments(
                this.validate_override(input.workspacePlan.launchCommand),
                workspaceKind,
                input.port,
            ),
            workingDirectory: input.workspaceRoot,
            port: input.port,
            healthPath: input.workspacePlan.healthPath,
            environment: { ...input.environment },
        };
    }
}
