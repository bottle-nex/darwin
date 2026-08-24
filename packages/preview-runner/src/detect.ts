import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { DetectInput, DetectOutput, Framework, PackageManager } from "./contract";

const SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    ".next",
    ".turbo",
    "dist",
    "build",
    "coverage",
    ".vercel",
]);
const LOCKFILES: { file: string; manager: PackageManager }[] = [
    { file: "bun.lock", manager: "bun" },
    { file: "bun.lockb", manager: "bun" },
    { file: "pnpm-lock.yaml", manager: "pnpm" },
    { file: "yarn.lock", manager: "yarn" },
    { file: "package-lock.json", manager: "npm" },
];
const ENV_EXAMPLE_FILES = [".env.example", ".env.sample", ".env.local.example", ".env.template"];
const STYLESHEET_IMPORT = /import\s+["']([^"']+\.(?:css|scss|sass))["']/g;
const BASE_PATH_SETTING = /\bbasePath\s*:\s*["'`]/;
const STATIC_EXPORT_SETTING = /\boutput\s*:\s*["'`]export["'`]/;

function unsupported(reason: string): DetectOutput {
    return {
        supported: false,
        reason,
        framework: null,
        nextAppDir: null,
        routeDir: null,
        pagesDir: null,
        hasExistingPagesDir: false,
        packageManager: null,
        lockfileRelPath: null,
        lockfileSha256: null,
        nextMajor: null,
        globalStylesheet: null,
        middlewarePaths: [],
        envExampleKeys: [],
        workspaceDirs: [],
        warnings: [],
    };
}

function read_json(path: string): Record<string, unknown> | null {
    try {
        return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function is_directory(path: string): boolean {
    try {
        return lstatSync(path).isDirectory();
    } catch {
        return false;
    }
}

function find_package_dirs(root: string): string[] {
    const found: string[] = [];

    const walk = (absolute: string) => {
        if (existsSync(join(absolute, "package.json"))) {
            found.push(relative(root, absolute) || ".");
        }

        let entries: string[];
        try {
            entries = readdirSync(absolute);
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.startsWith(".") || SKIP_DIRS.has(entry)) continue;
            const child = join(absolute, entry);
            if (is_directory(child)) walk(child);
        }
    };

    walk(root);
    return found;
}

function declared_next_version(packageJson: Record<string, unknown>): string | null {
    for (const field of ["dependencies", "devDependencies"] as const) {
        const group = packageJson[field];
        if (group && typeof group === "object" && "next" in group) {
            const value = (group as Record<string, unknown>).next;
            if (typeof value === "string") return value;
        }
    }
    return null;
}

function major_of(version: string): number | null {
    const match = version.match(/(\d+)/);
    return match ? Number(match[1]) : null;
}

/**
 * Picks which app a pull request is really about when a repo holds several Next.js apps.
 *
 * Scores each candidate by how many of the pull request's changed files live inside it, so a
 * change under `apps/admin` never gets previewed as `apps/web`. Falls back to the shallowest
 * candidate when the pull request touches none of them.
 *
 * @example
 * choose_app_dir(["apps/web", "apps/admin"], ["apps/admin/components/Sidebar.tsx"]);
 * // "apps/admin"
 */
export function choose_app_dir(candidates: string[], changedPaths: string[]): string {
    let best = candidates[0]!;
    let bestScore = -1;

    for (const candidate of candidates) {
        const prefix = candidate === "." ? "" : `${candidate}/`;
        const hits = changedPaths.filter((path) => path.startsWith(prefix)).length;
        const depth = candidate === "." ? 0 : candidate.split("/").length;
        const score = hits * 1000 - depth;
        if (score > bestScore) {
            best = candidate;
            bestScore = score;
        }
    }
    return best;
}

function nearest_lockfile(
    root: string,
    appDir: string,
): { relPath: string; manager: PackageManager } | null {
    const segments = appDir === "." ? [] : appDir.split("/");

    for (let depth = segments.length; depth >= 0; depth -= 1) {
        const dir = segments.slice(0, depth).join("/");
        for (const { file, manager } of LOCKFILES) {
            const relPath = dir ? `${dir}/${file}` : file;
            if (existsSync(join(root, relPath))) return { relPath, manager };
        }
    }
    return null;
}

function first_stylesheet_import(root: string, candidates: string[]): string | null {
    for (const candidate of candidates) {
        const absolute = join(root, candidate);
        if (!existsSync(absolute)) continue;

        const source = readFileSync(absolute, "utf8");
        for (const match of source.matchAll(STYLESHEET_IMPORT)) {
            const specifier = match[1]!;
            if (specifier.startsWith(".")) {
                const dir = candidate.split("/").slice(0, -1).join("/");
                return join(dir, specifier).split(sep).join("/");
            }
        }
    }
    return null;
}

function env_example_keys(root: string, appDir: string): string[] {
    const keys = new Set<string>();
    const dirs = appDir === "." ? ["."] : [".", appDir];

    for (const dir of dirs) {
        for (const file of ENV_EXAMPLE_FILES) {
            const absolute = join(root, dir === "." ? file : `${dir}/${file}`);
            if (!existsSync(absolute)) continue;

            for (const line of readFileSync(absolute, "utf8").split("\n")) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#")) continue;
                const name = trimmed.split("=")[0]?.trim();
                if (name && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) keys.add(name);
            }
        }
    }
    return [...keys].sort();
}

function next_config_problem(root: string, appDir: string): string | null {
    const base = appDir === "." ? "" : `${appDir}/`;

    for (const name of ["next.config.ts", "next.config.mjs", "next.config.js", "next.config.cjs"]) {
        const absolute = join(root, `${base}${name}`);
        if (!existsSync(absolute)) continue;

        const source = readFileSync(absolute, "utf8")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/^\s*\/\/.*$/gm, "");
        if (STATIC_EXPORT_SETTING.test(source)) {
            return 'next.config sets output: "export", which disables dynamic routes in dev';
        }
        if (BASE_PATH_SETTING.test(source)) {
            return "next.config sets a basePath, which moves the preview route";
        }
    }
    return null;
}

/**
 * Works out whether this checkout can be previewed, and everything needed to start it.
 *
 * Runs inside the sandbox against a checked-out worktree. One call replaces a dozen shell
 * round trips from the VM, and the values it returns are the same ones `scaffold` and the
 * dependency cache consume later.
 *
 * @example
 * detect({ workspaceRoot: "/home/user/workspace/head", changedPaths: ["apps/web/app/page.tsx"] });
 * // { supported: true, framework: "NextAppRouter", nextAppDir: "apps/web", packageManager: "bun", ... }
 */
export function detect(input: DetectInput): DetectOutput {
    const root = input.workspaceRoot;
    if (!is_directory(root)) return unsupported(`workspace ${root} does not exist`);
    if (existsSync(join(root, ".pnp.cjs")) || existsSync(join(root, ".pnp.js"))) {
        return unsupported("Yarn Plug'n'Play is not supported");
    }

    const workspaceDirs = find_package_dirs(root);
    const nextApps = workspaceDirs.filter((dir) => {
        const packageJson = read_json(
            join(root, dir === "." ? "package.json" : `${dir}/package.json`),
        );
        return packageJson !== null && declared_next_version(packageJson) !== null;
    });
    if (nextApps.length === 0) return unsupported("no Next.js package found");

    const warnings: string[] = [];
    const nextAppDir = choose_app_dir(nextApps, input.changedPaths);
    if (nextApps.length > 1) {
        warnings.push(`repository has ${nextApps.length} Next.js apps; previewing ${nextAppDir}`);
    }

    const configProblem = next_config_problem(root, nextAppDir);
    if (configProblem) return unsupported(configProblem);

    const appBase = nextAppDir === "." ? "" : `${nextAppDir}/`;
    const appRouterDir = ["app", "src/app"]
        .map((candidate) => `${appBase}${candidate}`)
        .find((candidate) => is_directory(join(root, candidate)));
    const pagesRouterDir = ["pages", "src/pages"]
        .map((candidate) => `${appBase}${candidate}`)
        .find((candidate) => is_directory(join(root, candidate)));

    const hasRootLayout =
        appRouterDir !== undefined &&
        ["tsx", "jsx", "ts", "js"].some((extension) =>
            existsSync(join(root, `${appRouterDir}/layout.${extension}`)),
        );

    let framework: Framework;
    let routeDir: string;
    if (hasRootLayout && appRouterDir) {
        framework = "NextAppRouter";
        routeDir = appRouterDir;
    } else if (pagesRouterDir) {
        framework = "NextPagesRouter";
        routeDir = pagesRouterDir;
    } else {
        return unsupported("no app/layout or pages directory found");
    }

    const lockfile = nearest_lockfile(root, nextAppDir);
    if (!lockfile) return unsupported("no lockfile found");

    const packageJson = read_json(
        join(root, nextAppDir === "." ? "package.json" : `${nextAppDir}/package.json`),
    );
    const nextVersion = packageJson ? declared_next_version(packageJson) : null;

    const middlewarePaths = [
        "middleware.ts",
        "middleware.js",
        "src/middleware.ts",
        "src/middleware.js",
    ]
        .map((candidate) => `${appBase}${candidate}`)
        .filter((candidate) => existsSync(join(root, candidate)));

    const stylesheetCandidates =
        framework === "NextAppRouter"
            ? ["tsx", "jsx", "ts", "js"].map((extension) => `${routeDir}/layout.${extension}`)
            : ["tsx", "jsx", "ts", "js"].map((extension) => `${routeDir}/_app.${extension}`);

    return {
        supported: true,
        reason: null,
        framework,
        nextAppDir,
        routeDir,
        pagesDir: pagesRouterDir ?? null,
        hasExistingPagesDir: pagesRouterDir !== undefined,
        packageManager: lockfile.manager,
        lockfileRelPath: lockfile.relPath,
        lockfileSha256: createHash("sha256")
            .update(readFileSync(join(root, lockfile.relPath)))
            .digest("hex"),
        nextMajor: nextVersion ? major_of(nextVersion) : null,
        globalStylesheet: first_stylesheet_import(root, stylesheetCandidates),
        middlewarePaths,
        envExampleKeys: env_example_keys(root, nextAppDir),
        workspaceDirs,
        warnings,
    };
}
