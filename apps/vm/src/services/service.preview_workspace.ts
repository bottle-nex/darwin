import { prisma } from "@trymatcha/database";
import type Logger from "@trymatcha/logger";
import type { Sandbox } from "e2b";

import type { PreviewDetect } from "./service.preview_runner";

const HARNESS_DIR = "matcha_preview";
const DISABLED_SUFFIX = ".matcha-disabled";
const OUR_OWN_FILES = [".env"];
const GIT_TIMEOUT_MS = 5 * 60_000;
const PLACEHOLDER = "matcha-preview-placeholder";
const UNREACHABLE_URL = "http://127.0.0.1:9";
const FIXED_ENV: Record<string, string> = {
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    CI: "1",
    TZ: "UTC",
};

function placeholder_for(key: string): string {
    if (/DATABASE_URL|POSTGRES/i.test(key))
        return "postgresql://matcha:matcha@127.0.0.1:5432/matcha";
    if (/REDIS/i.test(key)) return "redis://127.0.0.1:6379";
    if (/_URL$|_ENDPOINT$|_URI$/i.test(key)) return UNREACHABLE_URL;
    return PLACEHOLDER;
}

export default class PreviewWorkspace {
    /**
     * Fetches both revisions into their own folders inside one sandbox.
     *
     * Both must live on the same machine because the screenshots are compared pixel by pixel, and
     * two different machines would differ in font rendering alone — filling the diff with changes
     * no pull request made. The authenticated remote is removed as soon as the fetches finish so no
     * credential is present while the agent runs.
     *
     * @example
     * await PreviewWorkspace.checkout(sandbox, { repoDir, workspaceDir, remote, baseSha, headSha, pullNumber }, log);
     */
    static async checkout(
        sandbox: Sandbox,
        input: {
            repoDir: string;
            workspaceDir: string;
            remote: string;
            baseSha: string;
            headSha: string;
            pullNumber: number;
        },
    ): Promise<void> {
        const { repoDir, workspaceDir, remote, baseSha, headSha, pullNumber } = input;
        const git = { cwd: repoDir, timeoutMs: GIT_TIMEOUT_MS };

        await sandbox.commands.run(`rm -rf ${repoDir} ${workspaceDir}`);
        await sandbox.commands.run(`mkdir -p ${workspaceDir} && git init ${repoDir}`);
        await sandbox.commands.run(`git remote add origin ${remote}`, git);

        await sandbox.commands.run(`git fetch --depth=1 origin ${baseSha}`, git);
        const fetchedBase = await sandbox.commands.run("git rev-parse FETCH_HEAD", git);
        if (fetchedBase.stdout.trim() !== baseSha) {
            throw new Error("fetched base SHA does not match the Product Diff");
        }
        await sandbox.commands.run(
            `git worktree add --detach ${workspaceDir}/base ${baseSha}`,
            git,
        );

        await sandbox.commands.run(`git fetch --depth=1 origin refs/pull/${pullNumber}/head`, git);
        const fetchedHead = await sandbox.commands.run("git rev-parse FETCH_HEAD", git);
        if (fetchedHead.stdout.trim() !== headSha) {
            throw new Error("fetched head SHA does not match the Product Diff");
        }
        await sandbox.commands.run(
            `git worktree add --detach ${workspaceDir}/head ${headSha}`,
            git,
        );

        await sandbox.commands.run("git remote remove origin", git);
    }

    /**
     * Lists the files the pull request touched, used to pick the right app in a multi-app repository.
     *
     * @example
     * await PreviewWorkspace.changed_paths(sandbox, repoDir, baseSha, headSha);
     * // ["apps/web/components/layout/HeaderNav.tsx", "apps/web/app/globals.css"]
     */
    static async changed_paths(
        sandbox: Sandbox,
        repoDir: string,
        baseSha: string,
        headSha: string,
    ): Promise<string[]> {
        const result = await sandbox.commands
            .run(`git diff --name-only ${baseSha} ${headSha}`, { cwd: repoDir })
            .catch(() => null);
        if (!result) return [];

        return result.stdout
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
    }

    /**
     * Writes an environment file with the project's real variable names but harmless values.
     *
     * An app that only checks a variable is present will start normally, while no live credential
     * ever reaches a sandbox that renders generated code. Unreachable URLs point at the discard
     * port so that a component fetching on mount fails instantly into its error state, rather than
     * hanging until the page times out.
     *
     * @example
     * await PreviewWorkspace.write_placeholder_env(sandbox, worktree, "apps/web", detect, projectId);
     */
    static async write_placeholder_env(
        sandbox: Sandbox,
        worktree: string,
        applicationPath: string,
        detect: PreviewDetect,
        projectId: string,
    ): Promise<void> {
        const secretKeys = await prisma.projectSecret.findMany({
            where: { projectId },
            select: { key: true },
        });

        const keys = new Set([...detect.envExampleKeys, ...secretKeys.map((secret) => secret.key)]);
        const lines = [...keys]
            .filter((key) => !(key in FIXED_ENV))
            .map((key) => `${key}=${placeholder_for(key)}`);
        for (const [key, value] of Object.entries(FIXED_ENV)) lines.push(`${key}=${value}`);

        const contents = `${lines.join("\n")}\n`;
        const paths = new Set([`${worktree}/.env`]);
        if (applicationPath !== ".") {
            paths.add(`${worktree}/${applicationPath}/.env`);
        }
        for (const path of paths) {
            await sandbox.files.write(path, contents);
        }
    }

    /**
     * Renames the project's middleware out of the way in one revision.
     *
     * Most real apps redirect anyone without a session to a login page. Left in place, every target
     * quietly becomes a screenshot of that login page — the run looks successful and the diff is
     * worthless.
     *
     * @example
     * await PreviewWorkspace.disable_middleware(sandbox, worktree, ["apps/web/middleware.ts"]);
     */
    static async disable_middleware(
        sandbox: Sandbox,
        worktree: string,
        middlewarePaths: string[],
    ): Promise<void> {
        for (const path of middlewarePaths) {
            await sandbox.commands.run(
                `test -f ${worktree}/${path} && mv ${worktree}/${path} ${worktree}/${path}${DISABLED_SUFFIX} || true`,
            );
        }
    }

    /**
     * Copies the agent's harness components from head into base, unchanged.
     *
     * Only the components travel. The route files are generated separately on each side, so base
     * never inherits anything the agent may have touched in head.
     *
     * @example
     * await PreviewWorkspace.copy_harness(sandbox, headWorktree, baseWorktree, "apps/web");
     */
    static async copy_harness(
        sandbox: Sandbox,
        headWorktree: string,
        baseWorktree: string,
        nextAppDir: string,
    ): Promise<void> {
        const relative = nextAppDir === "." ? HARNESS_DIR : `${nextAppDir}/${HARNESS_DIR}`;
        const destination = `${baseWorktree}/${relative}`;
        await sandbox.commands.run(
            `mkdir -p "$(dirname ${destination})" && rm -rf ${destination} && cp -a ${headWorktree}/${relative} ${destination}`,
        );
    }

    /**
     * Restores any repository file the agent changed outside its own harness folder.
     *
     * This is the check that separates a trustworthy artifact from a convincing one. If the agent
     * edited the very component under review to make its harness easier to write, the screenshots
     * would no longer show the pull request — they would show the agent's edit. Offending files are
     * restored rather than failing the run, since one stray edit should not cost the whole preview.
     *
     * Git reports an untracked directory as a single entry rather than listing what is inside it,
     * so a generated route folder arrives as `apps/web/app/matcha-preview/` and never matches an
     * exact filename. Comparing prefixes in both directions is what keeps this from crying wolf on
     * every run — and a check that always warns is worse than no check, because people stop reading it.
     *
     * @example
     * await PreviewWorkspace.restore_unexpected_edits(sandbox, worktree, routeFiles, log);
     * // ["apps/web/components/layout/HeaderNav.tsx"]
     */
    static async restore_unexpected_edits(
        sandbox: Sandbox,
        worktree: string,
        allowedPaths: string[],
        log: Logger,
    ): Promise<string[]> {
        const status = await sandbox.commands
            .run("git status --porcelain", { cwd: worktree })
            .catch(() => null);
        if (!status) return [];

        const generated = [...allowedPaths, ...OUR_OWN_FILES];
        const restored: string[] = [];

        for (const line of status.stdout.split("\n")) {
            const path = line.slice(3).trim().replace(/^"|"$/g, "");
            if (!path) continue;
            if (path.includes(HARNESS_DIR)) continue;
            if (path === ".env" || path.endsWith("/.env")) continue;
            if (path.endsWith(DISABLED_SUFFIX) || path.includes("middleware")) continue;

            const ours = generated.some(
                (candidate) =>
                    candidate === path || candidate.startsWith(path) || path.startsWith(candidate),
            );
            if (ours) continue;

            await sandbox.commands
                .run(`git checkout -- ${JSON.stringify(path)}`, { cwd: worktree })
                .catch(() => undefined);
            restored.push(path);
        }

        if (restored.length) {
            log.warn("agent edited files outside its harness folder; they were restored", {
                count: restored.length,
                first: restored[0],
            });
        }
        return restored;
    }
}
