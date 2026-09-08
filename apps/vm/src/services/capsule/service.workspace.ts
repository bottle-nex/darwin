import type Logger from "@trydarwin/logger";
import type { Sandbox } from "e2b";

import { describe_failure } from "../sandbox/service.stream";

const REPO_DIR = "/home/user/repo";
const INSTALL_TIMEOUT_MS = 12 * 60_000;
const MAX_INSTALL_ERROR_CHARS = 2000;
export const GLOBAL_CSS_PATTERN = "@tailwind |@import [\"']?tailwindcss";

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm";

export interface AppProfile {
    appDir: string;
    packageManager: PackageManager;
    tailwindMajor: 3 | 4 | null;
    globalCssPath: string | null;
}

export interface PreparedWorkspace {
    profile: AppProfile;
    changedFiles: string[];
}

export class NoFrontendAppError extends Error {}

export class InstallFailedError extends Error {}

export interface PackageCandidate {
    dir: string;
    dependencies: Record<string, string>;
}

export function pick_package_manager(root_entries: string[]): PackageManager {
    const entries = new Set(root_entries);
    if (entries.has("bun.lock") || entries.has("bun.lockb")) return "bun";
    if (entries.has("pnpm-lock.yaml")) return "pnpm";
    if (entries.has("yarn.lock")) return "yarn";
    return "npm";
}

/**
 * Whether this repository is a JavaScript project at all.
 *
 * `pick_package_manager` falls back to npm when it recognises no lockfile, which is the right
 * answer for a JS repo that ships none and the wrong one for a Python, Go or Rust repo — those
 * have no manifest to install and must be left alone.
 */
export function has_node_project(root_entries: string[]): boolean {
    return root_entries.includes("package.json");
}

/**
 * `strict` pins to the lockfile and fails when the two have drifted. The capsule wants that: a
 * preview has to be reproducible. The solve sandbox does not — a lockfile a few commits stale is
 * common in real repositories, and refusing to install over it would block the whole run.
 */
export function install_command(manager: PackageManager, strict = true): string {
    switch (manager) {
        case "bun":
            return strict ? "bun install --frozen-lockfile" : "bun install";
        case "pnpm":
            return strict ? "pnpm install --frozen-lockfile" : "pnpm install --no-frozen-lockfile";
        case "yarn":
            return strict ? "yarn install --immutable" : "yarn install";
        case "npm":
            return strict ? "npm ci" : "npm install";
    }
}

/**
 * Installs the whole repository, never a subset.
 *
 * A partial install is worse than none: running the package manager fires the repo's
 * `prepare` script, which is what arms husky's git hooks — so a half-installed tree ends up
 * with a live pre-push hook it cannot satisfy, and every push is rejected.
 */
export async function install_dependencies(
    sandbox: Sandbox,
    manager: PackageManager,
    log: Logger,
    strict = true,
): Promise<void> {
    const command = install_command(manager, strict);
    log.step("installing repository dependencies", { command });

    try {
        await sandbox.commands.run(command, { cwd: REPO_DIR, timeoutMs: INSTALL_TIMEOUT_MS });
    } catch (error) {
        const failure = describe_failure("install dependencies", error, []);
        throw new InstallFailedError(
            `${command} failed: ${failure.message.slice(-MAX_INSTALL_ERROR_CHARS)}`,
        );
    }
}

export function read_tailwind_major(
    dependencies: Record<string, string>,
): AppProfile["tailwindMajor"] {
    const range = dependencies["tailwindcss"];
    if (!range) return null;

    const major = Number(range.match(/(\d+)/)?.[1]);
    return major === 3 || major === 4 ? major : null;
}

export function pick_app_dir(
    candidates: PackageCandidate[],
    changed_files: string[],
): string | null {
    const react_packages = candidates.filter((candidate) => "react" in candidate.dependencies);
    if (react_packages.length === 0) return null;

    const scored = react_packages.map((candidate) => ({
        dir: candidate.dir,
        depth: candidate.dir === "." ? 0 : candidate.dir.split("/").length,
        changed: changed_files.filter((file) => is_inside(candidate.dir, file)).length,
    }));

    scored.sort((left, right) => right.changed - left.changed || right.depth - left.depth);
    return scored[0]!.dir;
}

function is_inside(dir: string, file: string): boolean {
    return dir === "." || file.startsWith(`${dir}/`);
}

export default class CapsuleWorkspace {
    public static async prepare(
        sandbox: Sandbox,
        base_sha: string,
        head_sha: string,
        log: Logger,
    ): Promise<PreparedWorkspace> {
        await this.fetch_revisions(sandbox, base_sha, head_sha);

        const changed_files = await this.changed_files(sandbox, base_sha, head_sha);
        log.info("pull request touches files", { count: changed_files.length });

        const candidates = await this.package_candidates(sandbox);
        const app_dir = pick_app_dir(candidates, changed_files);
        if (!app_dir) throw new NoFrontendAppError("no React application found in this repository");

        const app_dependencies = candidates.find((entry) => entry.dir === app_dir)!.dependencies;
        const root_entries = await this.list_dir(sandbox, REPO_DIR);
        const package_manager = pick_package_manager(root_entries);

        const profile: AppProfile = {
            appDir: app_dir,
            packageManager: package_manager,
            tailwindMajor: read_tailwind_major(app_dependencies),
            globalCssPath: await this.find_global_css(sandbox, app_dir),
        };

        log.step("frontend application detected", {
            app: profile.appDir,
            manager: profile.packageManager,
            tailwind: profile.tailwindMajor ?? "none",
            globalCss: profile.globalCssPath ?? "none",
        });

        await install_dependencies(sandbox, profile.packageManager, log);
        return { profile, changedFiles: changed_files };
    }

    private static async fetch_revisions(
        sandbox: Sandbox,
        base_sha: string,
        head_sha: string,
    ): Promise<void> {
        for (const sha of [base_sha, head_sha]) {
            await sandbox.commands.run(`git fetch --depth 1 origin ${sha}`, { cwd: REPO_DIR });
        }
    }

    private static async changed_files(
        sandbox: Sandbox,
        base_sha: string,
        head_sha: string,
    ): Promise<string[]> {
        const result = await sandbox.commands.run(`git diff --name-only ${base_sha} ${head_sha}`, {
            cwd: REPO_DIR,
        });
        return result.stdout
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
    }

    private static async package_candidates(sandbox: Sandbox): Promise<PackageCandidate[]> {
        const found = await sandbox.commands.run(
            "find . -name package.json -not -path '*/node_modules/*' -maxdepth 4",
            { cwd: REPO_DIR },
        );
        const paths = found.stdout
            .split("\n")
            .map((line) => line.trim().replace(/^\.\//, ""))
            .filter(Boolean);

        const candidates: PackageCandidate[] = [];
        for (const path of paths) {
            const dir = path === "package.json" ? "." : path.slice(0, -"/package.json".length);
            const manifest = await this.read_json(sandbox, `${REPO_DIR}/${path}`);
            if (!manifest) continue;
            candidates.push({
                dir,
                dependencies: {
                    ...((manifest.dependencies as Record<string, string>) ?? {}),
                    ...((manifest.devDependencies as Record<string, string>) ?? {}),
                },
            });
        }
        return candidates;
    }

    private static async find_global_css(
        sandbox: Sandbox,
        app_dir: string,
    ): Promise<string | null> {
        const result = await sandbox.commands
            .run(`grep -rlE ${JSON.stringify(GLOBAL_CSS_PATTERN)} --include=*.css ${app_dir}`, {
                cwd: REPO_DIR,
            })
            .catch(() => null);

        const matches = (result?.stdout ?? "")
            .split("\n")
            .map((line) => line.trim().replace(/^\.\//, ""))
            .filter(Boolean);

        return matches.sort((left, right) => left.length - right.length)[0] ?? null;
    }

    private static async list_dir(sandbox: Sandbox, dir: string): Promise<string[]> {
        const entries = await sandbox.files.list(dir);
        return entries.map((entry) => entry.name);
    }

    private static async read_json(
        sandbox: Sandbox,
        path: string,
    ): Promise<Record<string, unknown> | null> {
        try {
            return JSON.parse(await sandbox.files.read(path)) as Record<string, unknown>;
        } catch {
            return null;
        }
    }
}
