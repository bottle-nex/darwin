import { Prisma, prisma } from "@trymatcha/database";
import Logger from "@trymatcha/logger";
import type { ProductDiffViewport } from "@trymatcha/types";
import { CommandExitError, Sandbox } from "e2b";
import { ENV } from "../conf/config.env";
import ClaudeRun from "./service.claude_run";
import GithubService from "./service.github";
import PreviewDeps from "./service.preview_deps";
import PreviewRunner, { type PreviewDetect, type ScaffoldMode } from "./service.preview_runner";
import PreviewServer, { type PreviewServerHandle } from "./service.preview_server";
import PreviewWorkspace from "./service.preview_workspace";
import ProductDiffArtifacts from "./service.product_diff_artifacts";
import { redact } from "./service.sandbox_stream";

const SANDBOX_TIMEOUT_MS = 55 * 60_000;
const AGENT_TIMEOUT_MS = 15 * 60_000;
const SNAPSHOT_DEADLINE_MS = 30 * 60_000;
const REPO_DIR = "/home/user/repo";
const WORKSPACE_DIR = "/home/user/workspace";
const PREVIEW_DIR = "/home/user/preview";
const SHOTS_DIR = "/home/user/output/shots";
const PROMPT_PATH = "/home/user/product_diff_prompt.txt";
const HEAD_PORT = 41337;
const BASE_PORT = 41338;
const MAX_SHOTS = 48;
const MAX_ERROR_OUTPUT = 400;
const FROZEN_NOW_MS = 1_750_000_000_000;
const SAFE_REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SAFE_SHA = /^[0-9a-f]{40,64}$/;
const VIEWPORTS: ProductDiffViewport[] = [
    { id: "desktop", label: "Desktop", width: 1280, height: 800 },
    { id: "mobile", label: "Mobile", width: 390, height: 844 },
];
const SERVER_ENV = {
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    CI: "1",
    TZ: "UTC",
};

function is_current_product_diff(
    pull: { state: string; baseSha: string; headSha: string },
    baseSha: string,
    headSha: string,
): boolean {
    return pull.state === "open" && pull.baseSha === baseSha && pull.headSha === headSha;
}

function describe_product_diff_failure(stage: string, error: unknown): string {
    const fallback = error instanceof Error ? error.message : String(error);
    if (!(error instanceof CommandExitError)) return `${stage} failed: ${fallback}`;

    const output = error.stderr.trim() || error.stdout.trim() || error.error?.trim() || fallback;
    return `${stage} failed (exit ${error.exitCode}): ${output.slice(-MAX_ERROR_OUTPUT)}`;
}

function prompt(input: {
    baseSha: string;
    headSha: string;
    nextAppDir: string;
    framework: string;
}): string {
    const appDir = `${WORKSPACE_DIR}/head/${input.nextAppDir}`;

    return `You are preparing a visual preview for a pull request. You will NOT draw anything.
You write React that mounts the project's REAL components with fixed data.

Revisions
  base commit:   ${input.baseSha}
  head commit:   ${input.headSha}
  base worktree: ${WORKSPACE_DIR}/base
  head worktree: ${WORKSPACE_DIR}/head
  Next.js app:   ${appDir}   (${input.framework})

Work only inside ${appDir}/matcha_preview/. You write exactly two kinds of file there:
  targets/<targetId>.tsx   one per target
  manifest.json            the index of targets

Step 1 - choose targets.
  Run: git diff ${input.baseSha} ${input.headSha} --stat
  Then read the changed files that matter.
  A target is a component or page a human would look at to judge this pull request.
  Pick between 1 and 4 targets. Prefer the smallest component that fully contains the visual
  change over the page that renders it. Skip pure logic, tests, config, types, server actions,
  and anything with no rendered output.

Step 2 - write one target file per target.
  Path: matcha_preview/targets/<targetId>.tsx
  It must start with "use client" and default-export:
      export default function Target({ state }: { state: string })
  Import the real component from the real source using the project's own import alias.
  Never copy a component's markup into the target file. Never reimplement it.
  Supply every prop from a literal fixture defined in the target file.
  Replace providers, context, data hooks, server data, cookies, headers, auth and backend calls
  with local deterministic stand-ins wrapped around the real component. If the component needs a
  provider to render, wrap it in the project's real provider with a literal value.
  The fixture must be byte-stable: no Date.now(), no new Date() without arguments, no
  Math.random(), no crypto.randomUUID(), no counters, no locale-dependent formatting, no network
  access, no remote image URLs.
  "state" selects between meaningful variants: default, empty, loading, error, long-content -
  whatever this component actually distinguishes. One state is fine if there is only one.

Step 3 - write matcha_preview/manifest.json
  {
    "targets": [
      { "id": "header-nav",
        "label": "Header navigation",
        "sourcePath": "components/layout/HeaderNav.tsx",
        "states": [ { "id": "default", "label": "Signed in" },
                    { "id": "signed-out", "label": "Signed out" } ] }
    ],
    "warnings": []
  }
  id must match ^[a-z0-9][a-z0-9-]{0,48}$ and equal the target file's name.
  sourcePath is relative to ${input.nextAppDir}.
  At most 4 targets and at most 4 states each.
  Put anything a reviewer should distrust into warnings.

Step 4 - verify. This is not optional.
  Run: preview-check
  It mounts every target and every state in a real browser and prints the exact error for any
  that fail. Fix the target file and run it again. Repeat until it exits 0. A target you cannot
  make render must be deleted from manifest.json, with the reason added to warnings.

Hard rules
  Do not create, edit, move or delete any file outside matcha_preview/.
  Do not write HTML files, do not write CSS, do not write screenshots.
  Do not install or remove dependencies, run package scripts, or edit package.json.
  Do not commit, push, or touch git state.
  Do not start or stop servers. One is already running and preview-check uses it.
  Do not call any network service.
  Finish with preview-check exiting 0 and manifest.json listing at least one target.`;
}

export default class ProductDiffRunner {
    private static async settle(
        productDiffId: string,
        status: "Ready" | "Stale" | "Failed" | "Unsupported",
        data: Prisma.ProductDiffUpdateManyMutationInput = {},
    ): Promise<void> {
        await prisma.productDiff.updateMany({
            where: { id: productDiffId, status: "Generating" },
            data: { status, ...data },
        });
    }

    private static async prepare_revisions(
        sandbox: Sandbox,
        detect: PreviewDetect,
        projectId: string,
    ): Promise<void> {
        for (const revision of ["head", "base"] as const) {
            const worktree = `${WORKSPACE_DIR}/${revision}`;
            await PreviewWorkspace.write_placeholder_env(
                sandbox,
                worktree,
                detect.nextAppDir!,
                detect,
                projectId,
            );
            await PreviewWorkspace.disable_middleware(sandbox, worktree, detect.middlewarePaths);
        }
    }

    private static async start_sandbox(
        snapshotId: string | null,
        projectId: string,
        log: Logger,
    ): Promise<Sandbox> {
        if (snapshotId) {
            try {
                const warm = await Sandbox.create(snapshotId, {
                    apiKey: ENV.SERVER_E2B_API_KEY,
                    timeoutMs: SANDBOX_TIMEOUT_MS,
                });
                log.info("booted from the project's dependency snapshot", { snapshot: snapshotId });
                return warm;
            } catch (error) {
                log.warn("dependency snapshot could not be used; starting cold", {
                    reason: error instanceof Error ? error.message : String(error),
                });
                await PreviewDeps.forget_snapshot(projectId);
            }
        }

        return Sandbox.create(ENV.SERVER_SANDBOX_TEMPLATE, {
            apiKey: ENV.SERVER_E2B_API_KEY,
            timeoutMs: SANDBOX_TIMEOUT_MS,
        });
    }

    private static async bring_up_head(
        sandbox: Sandbox,
        detect: PreviewDetect,
        log: Logger,
    ): Promise<{ server: PreviewServerHandle; mode: ScaffoldMode; routeFiles: string[] } | null> {
        const worktree = `${WORKSPACE_DIR}/head`;
        const modes: ScaffoldMode[] = detect.hasExistingPagesDir
            ? ["AppRoute"]
            : ["AppRoute", "PagesEscape"];

        for (const mode of modes) {
            const scaffold = await PreviewRunner.scaffold(sandbox, worktree, detect, mode);
            const server = await PreviewServer.start(
                sandbox,
                { worktree, nextAppDir: detect.nextAppDir!, port: HEAD_PORT, label: "head" },
                SERVER_ENV,
            );

            if (await PreviewServer.wait_until_ready(sandbox, server, log)) {
                return { server, mode, routeFiles: scaffold.routeFiles };
            }

            log.warn("head revision did not render with this mounting mode", { mode });
            await PreviewServer.stop(sandbox, HEAD_PORT);
        }
        return null;
    }

    static async run(productDiffId: string): Promise<void> {
        const claim = await prisma.productDiff.updateMany({
            where: { id: productDiffId, status: "Pending" },
            data: { status: "Generating", error: null },
        });
        if (claim.count === 0) return;

        const log = Logger.scope(`product-diff:${productDiffId.slice(-8)}`);
        const startedAt = Date.now();
        let sandbox: Sandbox | null = null;
        let githubToken = "";
        let stage = "load Product Diff";

        try {
            const productDiff = await prisma.productDiff.findUniqueOrThrow({
                where: { id: productDiffId },
                include: {
                    issue: { include: { project: { include: { githubInstallation: true } } } },
                },
            });
            const project = productDiff.issue.project;

            stage = "validate Product Diff metadata";
            if (
                !project.githubRepoFullName ||
                !project.githubRepoId ||
                !project.githubInstallation ||
                !SAFE_REPOSITORY.test(project.githubRepoFullName) ||
                !SAFE_SHA.test(productDiff.baseSha) ||
                !SAFE_SHA.test(productDiff.headSha)
            ) {
                throw new Error("Product Diff repository metadata is invalid");
            }

            stage = "create GitHub installation token";
            githubToken = await GithubService.getInstallationToken(
                Number(project.githubInstallation.installationId),
                Number(project.githubRepoId),
            );

            stage = "start preview sandbox";
            sandbox = await this.start_sandbox(project.previewSnapshotId, project.id, log);
            await sandbox.commands.run(`mkdir -p ${PREVIEW_DIR} ${SHOTS_DIR}`);

            stage = "fetch both revisions";
            const remote = `https://x-access-token:${githubToken}@github.com/${project.githubRepoFullName}.git`;
            await PreviewWorkspace.checkout(sandbox, {
                repoDir: REPO_DIR,
                workspaceDir: WORKSPACE_DIR,
                remote,
                baseSha: productDiff.baseSha,
                headSha: productDiff.headSha,
                pullNumber: productDiff.pullNumber,
            });

            stage = "inspect the project";
            const changedPaths = await PreviewWorkspace.changed_paths(
                sandbox,
                REPO_DIR,
                productDiff.baseSha,
                productDiff.headSha,
            );
            const detect = await PreviewRunner.detect(
                sandbox,
                `${WORKSPACE_DIR}/head`,
                changedPaths,
            );

            if (!detect.supported || !detect.nextAppDir || !detect.framework) {
                log.info("project cannot be previewed", { reason: detect.reason });
                await sandbox.kill();
                sandbox = null;
                await this.settle(productDiffId, "Unsupported", {
                    error: `Product Diff currently supports Next.js projects only — ${detect.reason ?? "no supported app found"}`,
                });
                return;
            }

            stage = "prepare both revisions";
            await this.prepare_revisions(sandbox, detect, project.id);

            stage = "install dependencies";
            const cacheKey = PreviewDeps.cache_key({
                packageManager: detect.packageManager!,
                lockfileRelPath: detect.lockfileRelPath!,
                lockfileSha256: detect.lockfileSha256!,
            });
            const warmCache =
                project.previewDepsHash === cacheKey && (await PreviewDeps.cache_present(sandbox));

            if (warmCache) {
                log.info("reusing the project's cached dependencies");
            } else {
                await PreviewDeps.install(sandbox, `${WORKSPACE_DIR}/head`, detect, log);
                await PreviewDeps.move_to_cache(
                    sandbox,
                    `${WORKSPACE_DIR}/head`,
                    detect.workspaceDirs,
                );

                if (Date.now() - startedAt < SNAPSHOT_DEADLINE_MS) {
                    stage = "save the dependency snapshot";
                    await sandbox.commands.run(`rm -rf ${REPO_DIR} ${WORKSPACE_DIR}`);
                    await PreviewDeps.remember_snapshot(
                        sandbox.sandboxId,
                        project.id,
                        cacheKey,
                        log,
                    );

                    stage = "restore both revisions after snapshotting";
                    await PreviewWorkspace.checkout(sandbox, {
                        repoDir: REPO_DIR,
                        workspaceDir: WORKSPACE_DIR,
                        remote,
                        baseSha: productDiff.baseSha,
                        headSha: productDiff.headSha,
                        pullNumber: productDiff.pullNumber,
                    });
                    await this.prepare_revisions(sandbox, detect, project.id);
                } else {
                    log.warn(
                        "skipping the dependency snapshot to stay within the sandbox lifetime",
                    );
                }
            }

            stage = "populate both revisions with dependencies";
            for (const revision of ["head", "base"] as const) {
                await PreviewDeps.restore_into(
                    sandbox,
                    `${WORKSPACE_DIR}/${revision}`,
                    detect.workspaceDirs,
                );
            }

            stage = "start head dev server";
            const head = await this.bring_up_head(sandbox, detect, log);
            if (!head) {
                const reason = detect.hasExistingPagesDir
                    ? "the app's root layout could not render and the project already uses a pages directory"
                    : "the app could not render with placeholder configuration";
                await sandbox.kill();
                sandbox = null;
                await this.settle(productDiffId, "Unsupported", {
                    error: `Product Diff could not start this project — ${reason}`,
                });
                return;
            }

            stage = "start base dev server";
            await PreviewRunner.scaffold(sandbox, `${WORKSPACE_DIR}/base`, detect, head.mode);
            const baseServer = await PreviewServer.start(
                sandbox,
                {
                    worktree: `${WORKSPACE_DIR}/base`,
                    nextAppDir: detect.nextAppDir,
                    port: BASE_PORT,
                    label: "base",
                },
                SERVER_ENV,
            );
            const baseReady = PreviewServer.wait_until_ready(sandbox, baseServer, log);

            stage = "run the harness agent";
            await PreviewRunner.write_check_env(sandbox, {
                workspaceRoot: `${WORKSPACE_DIR}/head`,
                nextAppDir: detect.nextAppDir,
                baseUrl: head.server.url,
                mode: head.mode,
                detect,
            });
            await sandbox.files.write(
                PROMPT_PATH,
                prompt({
                    baseSha: productDiff.baseSha,
                    headSha: productDiff.headSha,
                    nextAppDir: detect.nextAppDir,
                    framework: detect.framework,
                }),
            );
            await ClaudeRun.execute(sandbox, log, {
                prompt_path: PROMPT_PATH,
                model: ENV.SERVER_PREVIEW_MODEL,
                effort: ENV.SERVER_PREVIEW_EFFORT,
                envs: { CLAUDE_CODE_OAUTH_TOKEN: ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN },
                timeout_ms: AGENT_TIMEOUT_MS,
                label: "Product Diff harness agent",
            });

            stage = "validate the harness the agent wrote";
            const harness = await PreviewRunner.read_manifest(
                sandbox,
                `${WORKSPACE_DIR}/head/${detect.nextAppDir}`,
            );
            const restored = await PreviewWorkspace.restore_unexpected_edits(
                sandbox,
                `${WORKSPACE_DIR}/head`,
                head.routeFiles,
                log,
            );

            stage = "apply the harness to the base revision";
            await PreviewWorkspace.copy_harness(
                sandbox,
                `${WORKSPACE_DIR}/head`,
                `${WORKSPACE_DIR}/base`,
                detect.nextAppDir,
            );
            await PreviewRunner.scaffold(sandbox, `${WORKSPACE_DIR}/head`, detect, head.mode);
            await PreviewRunner.scaffold(sandbox, `${WORKSPACE_DIR}/base`, detect, head.mode);

            stage = "take the screenshots";
            const baseUsable = await baseReady;
            if (!baseUsable) {
                log.warn("base revision never became ready; shipping head-only screenshots");
            }
            const shoot = await PreviewRunner.shoot(sandbox, {
                headUrl: head.server.url,
                baseUrl: baseUsable ? baseServer.url : null,
                workspaceRoot: `${WORKSPACE_DIR}/head`,
                nextAppDir: detect.nextAppDir,
                outputDir: SHOTS_DIR,
                viewports: VIEWPORTS,
                frozenNowMs: FROZEN_NOW_MS,
                maxShots: MAX_SHOTS,
            });
            if (!shoot.ok) {
                const first = shoot.shots.find((shot) => shot.error)?.error;
                throw new Error(`no target could be rendered${first ? `: ${first}` : ""}`);
            }

            stage = "recheck the pull request before upload";
            const beforeUpload = await GithubService.getPullRequest(
                githubToken,
                project.githubRepoFullName,
                productDiff.pullNumber,
            );
            if (!is_current_product_diff(beforeUpload, productDiff.baseSha, productDiff.headSha)) {
                await sandbox.kill();
                sandbox = null;
                await this.settle(productDiffId, "Stale");
                return;
            }

            const prefix = `product-diffs/${project.id}/${productDiff.pullNumber}/${productDiff.baseSha}-${productDiff.headSha}/${productDiff.id}`;
            stage = "upload the screenshots";
            await ProductDiffArtifacts.upload(sandbox, SHOTS_DIR, prefix, log);

            stage = "recheck the pull request after upload";
            const afterUpload = await GithubService.getPullRequest(
                githubToken,
                project.githubRepoFullName,
                productDiff.pullNumber,
            );
            const current = is_current_product_diff(
                afterUpload,
                productDiff.baseSha,
                productDiff.headSha,
            );

            const warnings = [...detect.warnings];
            if (detect.middlewarePaths.length) {
                warnings.push("the project's middleware was disabled so targets could render");
            }
            if (restored.length) {
                warnings.push(
                    `the agent edited ${restored.length} file(s) outside its harness folder; they were restored`,
                );
            }
            const manifest = ProductDiffArtifacts.build_manifest({
                harness,
                shoot,
                framework: detect.framework,
                viewports: VIEWPORTS,
                warnings,
            });

            stage = "destroy preview sandbox";
            await sandbox.kill();
            sandbox = null;

            stage = "publish Product Diff";
            await this.settle(productDiffId, current ? "Ready" : "Stale", {
                manifest: manifest as unknown as Prisma.InputJsonValue,
                artifactPrefix: prefix,
            });
            log.success("Product Diff ready", {
                targets: manifest.targets.length,
                shots: shoot.shots.length,
            });
        } catch (error) {
            if (sandbox) {
                try {
                    await sandbox.kill();
                } catch {
                    // E2B timeout remains final cleanup.
                }
            }
            const message = redact(describe_product_diff_failure(stage, error), [
                githubToken,
                ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN,
            ]).slice(0, 500);
            log.error("generation failed", new Error(message));
            await this.settle(productDiffId, "Failed", { error: message });
        }
    }
}
