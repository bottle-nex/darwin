import type { ProductDiffPreviewConfiguration } from "@trymatcha/types";
import z from "zod";

const SAFE_APPLICATION_PATH = /^[A-Za-z0-9@._/-]+$/;
const SAFE_OVERRIDE = /^[A-Za-z0-9_@%+=:,./ -]+$/;
const SAFE_HEALTH_PATH = /^\/[A-Za-z0-9._~/-]*$/;
const PACKAGE_MANAGERS = new Set(["bun", "pnpm", "yarn", "npm"]);
const NETWORK_BINDING_ARGUMENT =
    /(?:^|\s)(?:--(?:hostname|host|port)(?:=|\s|$)|-(?:H|p)(?:=|\s|[^\s]+|$))/;

function valid_application_path(application_path: string): boolean {
    if (application_path === ".") return true;
    return (
        SAFE_APPLICATION_PATH.test(application_path) &&
        !application_path.startsWith("/") &&
        !application_path.endsWith("/") &&
        application_path
            .split("/")
            .every((segment) => segment !== "" && segment !== "." && segment !== "..")
    );
}

function valid_launch_command(command: string): boolean {
    if (!SAFE_OVERRIDE.test(command)) return false;
    const executable = command.split(/\s+/, 1)[0];
    return PACKAGE_MANAGERS.has(executable) && !NETWORK_BINDING_ARGUMENT.test(command);
}

const application_path_schema = z.string().min(1).max(240).refine(valid_application_path);
const launch_command_schema = z.string().trim().min(1).max(500).refine(valid_launch_command);
const health_path_schema = z.string().max(240).regex(SAFE_HEALTH_PATH);

export const product_diff_preview_config_schema = z
    .object({
        applicationPath: application_path_schema.optional(),
        launchCommand: launch_command_schema.optional(),
        healthPath: health_path_schema.optional(),
    })
    .strict()
    .refine((configuration) => Object.keys(configuration).length > 0);

export function read_product_diff_preview_config(
    value: unknown,
): ProductDiffPreviewConfiguration | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const application_path = application_path_schema.safeParse(source.applicationPath);
    const launch_command = launch_command_schema.safeParse(source.launchCommand);
    const health_path = health_path_schema.safeParse(source.healthPath);
    const configuration = {
        ...(application_path.success && { applicationPath: application_path.data }),
        ...(launch_command.success && { launchCommand: launch_command.data }),
        ...(health_path.success && { healthPath: health_path.data }),
    };
    return Object.keys(configuration).length > 0 ? configuration : null;
}

export function merge_product_diff_preview_config(
    existing: unknown,
    update: ProductDiffPreviewConfiguration,
): ProductDiffPreviewConfiguration {
    return { ...read_product_diff_preview_config(existing), ...update };
}
