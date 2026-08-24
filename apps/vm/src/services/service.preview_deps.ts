import { createHash } from "node:crypto";

import { prisma } from "@trymatcha/database";
import type Logger from "@trymatcha/logger";
import { Sandbox } from "e2b";

import { ENV } from "../conf/config.env";
import type { ProductDiffWorkspacePlan } from "./product_diff/adapter.contract";
import type { PackageManager, PreviewDetect } from "./service.preview_runner";

const DEPS_CACHE_DIR = "/home/user/.matcha/deps-cache";
const INSTALL_TIMEOUT_MS = 12 * 60_000;
const SNAPSHOT_TIMEOUT_MS = 6 * 60_000;
const COPY_TIMEOUT_MS = 3 * 60_000;

const INSTALL_COMMANDS: Record<PackageManager, string[]> = {
    bun: ["bun install --frozen-lockfile", "bun install"],
    pnpm: ["pnpm install --frozen-lockfile", "pnpm install --no-frozen-lockfile"],
    yarn: ["yarn install --immutable", "yarn install --frozen-lockfile"],
    npm: ["npm ci --no-audit --no-fund", "npm install --no-audit --no-fund"],
};

function lockfile_dir(worktree: string, lockfileRelPath: string): string {
    const segments = lockfileRelPath.split("/").slice(0, -1);
    return segments.length ? `${worktree}/${segments.join("/")}` : worktree;
}

function install_directory(worktree: string, directory: string): string {
    const normalized = directory.replaceAll("\\", "/").replace(/^\.\//, "");
    if (!normalized || normalized === ".") return worktree;
    if (normalized.startsWith("/") || normalized.split("/").includes("..")) {
        throw new Error("workspace installation directory must remain inside the worktree");
    }
    return `${worktree}/${normalized}`;
}

export default class PreviewDeps {
    /**
     * Turns everything that decides whether installed packages can be reused into one short string.
     *
     * The lockfile itself is never stored — only this 64 character fingerprint of it, so the check
     * costs nothing no matter how large the lockfile is. The template name is folded in so that
     * rebuilding the sandbox image with a new Node version retires every cached snapshot, rather
     * than leaving packages compiled against a runtime that is gone.
     *
     * @example
     * PreviewDeps.cache_key({ packageManager: "bun", lockfileRelPath: "bun.lock", lockfileSha256: "ab12…" });
     * // "9f2ad4…c41e"
     */
    static cache_key(input: {
        packageManager: PackageManager;
        lockfileRelPath: string;
        lockfileSha256: string;
    }): string {
        return createHash("sha256")
            .update(
                [
                    ENV.SERVER_SANDBOX_TEMPLATE,
                    input.packageManager,
                    input.lockfileRelPath,
                    input.lockfileSha256,
                ].join("\n"),
            )
            .digest("hex");
    }

    /**
     * Installs a project's packages, falling back to a looser command when the lockfile is rejected.
     *
     * Install scripts are deliberately left enabled. Projects using Prisma, sharp or the Next.js
     * native compiler do not start without them, and we are already running the project's own dev
     * server — the sandbox is the boundary here, not the install flags.
     *
     * @example
     * await PreviewDeps.install(sandbox, "/home/user/workspace/head", detect, log);
     */
    static async install(
        sandbox: Sandbox,
        worktree: string,
        workspacePlan: ProductDiffWorkspacePlan,
        detect: PreviewDetect,
        log: Logger,
    ): Promise<void>;
    static async install(
        sandbox: Sandbox,
        worktree: string,
        detect: PreviewDetect,
        log: Logger,
    ): Promise<void>;
    static async install(
        sandbox: Sandbox,
        worktree: string,
        workspacePlanOrDetect: ProductDiffWorkspacePlan | PreviewDetect,
        detectOrLog: PreviewDetect | Logger,
        optionalLog?: Logger,
    ): Promise<void> {
        const usesWorkspacePlan = "installDirectory" in workspacePlanOrDetect;
        const workspacePlan = usesWorkspacePlan ? workspacePlanOrDetect : null;
        const detect = usesWorkspacePlan
            ? (detectOrLog as PreviewDetect)
            : (workspacePlanOrDetect as PreviewDetect);
        const log = usesWorkspacePlan ? optionalLog! : (detectOrLog as Logger);
        if (!detect.packageManager || !detect.lockfileRelPath) {
            throw new Error("cannot install without a detected package manager");
        }

        const cwd = workspacePlan
            ? install_directory(worktree, workspacePlan.installDirectory)
            : lockfile_dir(worktree, detect.lockfileRelPath);
        const [primary, fallback] = INSTALL_COMMANDS[detect.packageManager];

        try {
            await sandbox.commands.run(primary!, { cwd, timeoutMs: INSTALL_TIMEOUT_MS });
        } catch {
            log.warn("frozen install failed, retrying without the lockfile constraint", {
                package_manager: detect.packageManager,
            });
            await sandbox.commands.run(fallback!, { cwd, timeoutMs: INSTALL_TIMEOUT_MS });
        }
    }

    /**
     * Reports whether this sandbox already carries a dependency cache.
     *
     * @example
     * await PreviewDeps.cache_present(sandbox); // true when booted from a warm snapshot
     */
    static async cache_present(sandbox: Sandbox): Promise<boolean> {
        const result = await sandbox.commands.run(
            `test -d ${DEPS_CACHE_DIR} && echo present || echo absent`,
        );
        return result.stdout.trim() === "present";
    }

    /**
     * Moves freshly installed packages out of the checkout and into the cache directory.
     *
     * Moving rather than copying is what keeps the snapshot free of customer source: once this has
     * run, the whole checkout can be deleted before the machine is frozen, so the saved image holds
     * third-party libraries and nothing else.
     *
     * @example
     * await PreviewDeps.move_to_cache(sandbox, "/home/user/workspace/head", [".", "apps/web"]);
     */
    static async move_to_cache(
        sandbox: Sandbox,
        worktree: string,
        workspaceDirs: string[],
    ): Promise<void> {
        await sandbox.commands.run(`rm -rf ${DEPS_CACHE_DIR} && mkdir -p ${DEPS_CACHE_DIR}`);

        for (const dir of workspaceDirs) {
            const source =
                dir === "." ? `${worktree}/node_modules` : `${worktree}/${dir}/node_modules`;
            const destination = dir === "." ? `${DEPS_CACHE_DIR}/root` : `${DEPS_CACHE_DIR}/${dir}`;
            await sandbox.commands.run(
                `test -d ${source} && mkdir -p "$(dirname ${destination})" && mv ${source} ${destination} || true`,
                { timeoutMs: COPY_TIMEOUT_MS },
            );
        }
    }

    /**
     * Puts cached packages back into a checkout using hardlinks.
     *
     * Hardlinking makes the same files visible in two places without copying their bytes, so a
     * three hundred megabyte tree lands in about two seconds instead of ninety. It falls back to a
     * real copy if the cache and the checkout ever end up on different filesystems.
     *
     * @example
     * await PreviewDeps.restore_into(sandbox, "/home/user/workspace/base", [".", "apps/web"]);
     */
    static async restore_into(
        sandbox: Sandbox,
        worktree: string,
        workspaceDirs: string[],
    ): Promise<void> {
        for (const dir of workspaceDirs) {
            const source = dir === "." ? `${DEPS_CACHE_DIR}/root` : `${DEPS_CACHE_DIR}/${dir}`;
            const destination =
                dir === "." ? `${worktree}/node_modules` : `${worktree}/${dir}/node_modules`;
            await sandbox.commands.run(
                `test -d ${source} && mkdir -p "$(dirname ${destination})" && rm -rf ${destination} && (cp -al ${source} ${destination} || cp -a ${source} ${destination}) || true`,
                { timeoutMs: COPY_TIMEOUT_MS },
            );
        }
    }

    /**
     * Freezes the sandbox as a reusable image and remembers it against the project.
     *
     * Never allowed to fail the run: a snapshot that does not get taken only costs the next pull
     * request its install time, whereas treating it as fatal would throw away a preview that has
     * already been produced.
     *
     * @example
     * await PreviewDeps.remember_snapshot(sandbox.sandboxId, projectId, cacheKey, log);
     */
    static async remember_snapshot(
        sandboxId: string,
        projectId: string,
        cacheKey: string,
        log: Logger,
    ): Promise<void> {
        try {
            const previous = await prisma.project.findUnique({
                where: { id: projectId },
                select: { previewSnapshotId: true },
            });

            let expiry: ReturnType<typeof setTimeout> | undefined;
            const snapshot = await Promise.race([
                Sandbox.createSnapshot(sandboxId, { apiKey: ENV.SERVER_E2B_API_KEY }),
                new Promise<never>((_, reject) => {
                    expiry = setTimeout(
                        () => reject(new Error("snapshot timed out")),
                        SNAPSHOT_TIMEOUT_MS,
                    );
                }),
            ]).finally(() => clearTimeout(expiry));

            await prisma.project.update({
                where: { id: projectId },
                data: {
                    previewSnapshotId: snapshot.snapshotId,
                    previewDepsHash: cacheKey,
                    previewSnapshotAt: new Date(),
                },
            });
            log.success("dependency snapshot saved", { snapshot: snapshot.snapshotId });

            if (previous?.previewSnapshotId) {
                log.info("previous dependency snapshot superseded", {
                    snapshot: previous.previewSnapshotId,
                });
            }
        } catch (error) {
            log.warn("could not save the dependency snapshot; the next run will install again", {
                reason: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Forgets a snapshot that no longer exists, so the next run starts cold instead of failing.
     *
     * @example
     * await PreviewDeps.forget_snapshot(projectId);
     */
    static async forget_snapshot(projectId: string): Promise<void> {
        await prisma.project.update({
            where: { id: projectId },
            data: { previewSnapshotId: null, previewDepsHash: null, previewSnapshotAt: null },
        });
    }
}
