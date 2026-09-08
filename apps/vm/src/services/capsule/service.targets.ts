import type { CapsuleChange } from "@trydarwin/types";
import type { Sandbox } from "e2b";

import type { AppProfile } from "./service.workspace";

const REPO_DIR = "/home/user/repo";

export const MAX_CAPSULES = 6;

const COMPONENT_EXTENSIONS = [".tsx", ".jsx"];
const EXCLUDED_NAME = /\.(test|spec|stories|d)\./;
const EXCLUDED_PATH = /(^|\/)(api|node_modules|__mocks__|__tests__)\//;
const SERVER_DIRECTIVE = /^\s*["']use server["']/m;
const ASYNC_COMPONENT = /export\s+(default\s+)?async\s+function\s+[A-Z]/;

export interface DiffEntry {
    change: CapsuleChange;
    componentPath: string;
    basePath: string | null;
}

export interface CapsuleTarget extends DiffEntry {
    id: string;
}

export interface TargetSelection {
    targets: CapsuleTarget[];
    warnings: string[];
}

export function capsule_id(component_path: string): string {
    return component_path
        .replace(/\.[jt]sx$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function classify_diff_line(line: string): DiffEntry | null {
    const [status, first, second] = line.split("\t");
    if (!status || !first) return null;

    if (status.startsWith("R") && second) {
        return { change: "Modified", componentPath: second, basePath: first };
    }
    if (status.startsWith("A")) {
        return { change: "Added", componentPath: first, basePath: null };
    }
    if (status.startsWith("D")) {
        return { change: "Removed", componentPath: first, basePath: first };
    }
    return { change: "Modified", componentPath: first, basePath: first };
}

export function is_previewable_source(path: string, app_dir: string): boolean {
    if (app_dir !== "." && !path.startsWith(`${app_dir}/`)) return false;
    if (!COMPONENT_EXTENSIONS.some((extension) => path.endsWith(extension))) return false;
    if (EXCLUDED_NAME.test(path)) return false;
    return !EXCLUDED_PATH.test(path);
}

export function select_targets(
    entries: DiffEntry[],
    sources: Record<string, string>,
): TargetSelection {
    const warnings: string[] = [];
    const eligible: CapsuleTarget[] = [];

    for (const entry of entries) {
        const source = sources[entry.componentPath] ?? "";
        if (SERVER_DIRECTIVE.test(source) || ASYNC_COMPONENT.test(source)) {
            warnings.push(
                `${entry.componentPath} was skipped because it is a server component and cannot run in a browser`,
            );
            continue;
        }
        eligible.push({ id: capsule_id(entry.componentPath), ...entry });
    }

    if (eligible.length > MAX_CAPSULES) {
        const dropped = eligible.slice(MAX_CAPSULES).map((target) => target.componentPath);
        warnings.push(
            `Only the first ${MAX_CAPSULES} changed components are previewed. Not previewed: ${dropped.join(", ")}`,
        );
    }

    return { targets: eligible.slice(0, MAX_CAPSULES), warnings };
}

export default class CapsuleTargets {
    public static async pick(
        sandbox: Sandbox,
        profile: AppProfile,
        base_sha: string,
        head_sha: string,
    ): Promise<TargetSelection> {
        const diff = await sandbox.commands.run(
            `git diff --name-status -M ${base_sha} ${head_sha}`,
            { cwd: REPO_DIR },
        );

        const entries = diff.stdout
            .split("\n")
            .map((line) => classify_diff_line(line.trim()))
            .filter((entry): entry is DiffEntry => entry !== null)
            .filter((entry) => is_previewable_source(entry.componentPath, profile.appDir));

        const sources = await this.read_head_sources(sandbox, head_sha, entries);
        return select_targets(entries, sources);
    }

    private static async read_head_sources(
        sandbox: Sandbox,
        head_sha: string,
        entries: DiffEntry[],
    ): Promise<Record<string, string>> {
        const sources: Record<string, string> = {};
        for (const entry of entries) {
            if (entry.change === "Removed") continue;
            const shown = await sandbox.commands
                .run(`git show ${head_sha}:${entry.componentPath}`, { cwd: REPO_DIR })
                .catch(() => null);
            sources[entry.componentPath] = shown?.stdout ?? "";
        }
        return sources;
    }
}
