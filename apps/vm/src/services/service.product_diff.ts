import type { Prisma } from "@trymatcha/database";
import { prisma } from "@trymatcha/database";
import Logger from "@trymatcha/logger";
import type { ProductDiffDiagnostic, ProductDiffViewport } from "@trymatcha/types";
import { CommandExitError, Sandbox } from "e2b";

import { ENV } from "../conf/config.env";
import ClaudeRun from "./service.claude_run";
import GithubService from "./service.github";
import PreviewDeps from "./service.preview_deps";
import PreviewRunner, {
    type NextApplicationRouter,
    type PreviewDetect,
    type PreviewSurface,
} from "./service.preview_runner";
import PreviewServer, { type PreviewServerHandle } from "./service.preview_server";
import PreviewWorkspace from "./service.preview_workspace";
import ProductDiffArtifacts from "./service.product_diff_artifacts";
import { sanitize_preview_diagnostic_message } from "./product_diff/service.preview_diagnostic_sanitizer";
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
];
const SERVER_ENV = {
    NODE_ENV: "development",
    NODE_OPTIONS: "--max-old-space-size=2048",
    NEXT_TELEMETRY_DISABLED: "1",
    CI: "1",
    TZ: "UTC",
};
const PREVIEW_UNAVAILABLE_STAGES = new Set([
    "start head dev server",
    "verify the head preview surface",
    "photograph the head revision",
    "start base dev server",
    "verify the base preview surface",
    "photograph the base revision",
]);

export function product_diff_failure_status(stage: string): "PreviewUnavailable" | "Failed" {
    return PREVIEW_UNAVAILABLE_STAGES.has(stage) ? "PreviewUnavailable" : "Failed";
}

export function preview_check_error(
    revision: "head" | "base",
    failed:
        | {
              targetId: string;
              stateId: string;
              problem: string | null;
              detail: string | null;
          }
        | undefined,
): Error {
    const target = failed ? `${failed.targetId}/${failed.stateId}` : "unknown target";
    const problem = failed?.problem ?? "render failed";
    const detail = failed?.detail ? `: ${failed.detail.slice(0, MAX_ERROR_OUTPUT)}` : "";
    return new Error(`${revision} preview validation failed: ${target} ${problem}${detail}`);
}

export function preview_unavailable_diagnostic(
    stage: string,
    message: string,
    applicationPath: string | null,
): ProductDiffDiagnostic {
    const browserValidation = stage.includes("verify") || stage.includes("photograph");
    return {
        code: browserValidation
            ? "PREVIEW_BROWSER_VALIDATION_FAILED"
            : "PREVIEW_SERVER_UNAVAILABLE",
        stage: browserValidation ? "browser-validation" : "startup",
        message: sanitize_preview_diagnostic_message(message),
        adapter: "next",
        applicationPath,
        workspaceKind: null,
    };
}

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

function diagnostic_summary(output: string): string {
    return output.replace(/\s+/g, " ").trim().slice(-MAX_ERROR_OUTPUT);
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
  label is at most 80 characters, for both a target and a state.
  Put anything a reviewer should distrust into warnings, as short one-line notes.
  At most 20 warnings, each at most 300 characters. Split a long note into several short ones.

Step 4 - finish the harness.
  The Product Diff pipeline validates every target in a real browser after you exit. Do not run
  preview-check yourself; the server is intentionally stopped while you work to keep the sandbox
  within its memory limit.

Hard rules
  Do not create, edit, move or delete any file outside matcha_preview/.
  Do not write HTML files, do not write CSS, do not write screenshots.
  Do not install or remove dependencies, run package scripts, or edit package.json.
  Do not commit, push, or touch git state.
  Do not start or stop servers.
  Do not call any network service.
  Finish with manifest.json listing at least one target.`;
}

export default class ProductDiffRunner {
    private static async settle(
        productDiffId: string,
        status: "Ready" | "Stale" | "Failed" | "Unsupported" | "PreviewUnavailable",
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
                if (await PreviewRunner.supports_current_protocol(warm)) {
                    log.info("booted from the project's dependency snapshot", {
                        snapshot: snapshotId,
                    });
                    return warm;
                }

                log.warn("dependency snapshot has an outdated preview runner; starting cold", {
                    snapshot: snapshotId,
                });
                await warm.kill();
                await PreviewDeps.forget_snapshot(projectId);
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
        runId: string,
        log: Logger,
    ): Promise<{
        server: PreviewServerHandle;
        surface: PreviewSurface;
        routeFiles: string[];
    } | null> {
        const worktree = `${WORKSPACE_DIR}/head`;
        const scaffold = await PreviewRunner.scaffold(sandbox, worktree, detect);
        const router: NextApplicationRouter =
            detect.framework === "NextAppRouter" ? "AppRouter" : "PagesRouter";
        const surface = await PreviewRunner.create_next_preview_surface(sandbox, {
            workspaceRoot: worktree,
            applicationPath: detect.nextAppDir!,
            routeSegment: `preview-${runId}`,
            router,
        });
        const server = await PreviewServer.start(
            sandbox,
            { worktree, nextAppDir: detect.nextAppDir!, port: HEAD_PORT, label: "head" },
            SERVER_ENV,
        );

        if (await PreviewServer.wait_until_ready(sandbox, server, log)) {
            return {
                server,
                surface,
                routeFiles: [...scaffold.routeFiles, ...surface.generatedFiles],
            };
        }

        const tail = await PreviewServer.log_tail(sandbox, server);
        log.warn("head revision did not render", { router });
        if (tail) log.block("head dev server output", tail);
        await PreviewServer.stop(server);
        await PreviewRunner.remove_next_preview_surface(sandbox, surface);
        return null;
    }

    private static async preview_diagnostics(
        sandbox: Sandbox,
        server: PreviewServerHandle | null,
    ): Promise<string> {
        if (!server) return "";
        const output = await PreviewServer.log_tail(sandbox, server);
        return output ? `dev server\n${output}` : "";
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
        let activeServer: PreviewServerHandle | null = null;
        let githubToken = "";
        let stage = "load Product Diff";
        let previewApplicationPath: string | null = null;
        const step = (name: string) => {
            stage = name;
            log.step(name);
        };

        try {
            const productDiff = await prisma.productDiff.findUniqueOrThrow({
                where: { id: productDiffId },
                include: {
                    issue: { include: { project: { include: { githubInstallation: true } } } },
                },
            });
            const project = productDiff.issue.project;

            step("validate Product Diff metadata");
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

            step("create GitHub installation token");
            githubToken = await GithubService.getInstallationToken(
                Number(project.githubInstallation.installationId),
                Number(project.githubRepoId),
            );

            step("start preview sandbox");
            sandbox = await this.start_sandbox(project.previewSnapshotId, project.id, log);
            await sandbox.commands.run(`mkdir -p ${PREVIEW_DIR} ${SHOTS_DIR}`);

            step("fetch both revisions");
            const remote = `https://x-access-token:${githubToken}@github.com/${project.githubRepoFullName}.git`;
            await PreviewWorkspace.checkout(sandbox, {
                repoDir: REPO_DIR,
                workspaceDir: WORKSPACE_DIR,
                remote,
                baseSha: productDiff.baseSha,
                headSha: productDiff.headSha,
                pullNumber: productDiff.pullNumber,
            });

            step("inspect the project");
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
            previewApplicationPath = detect.nextAppDir;

            step("prepare both revisions");
            await this.prepare_revisions(sandbox, detect, project.id);

            step("install dependencies");
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
                    step("save the dependency snapshot");
                    await sandbox.commands.run(`rm -rf ${REPO_DIR} ${WORKSPACE_DIR}`);
                    await PreviewDeps.remember_snapshot(
                        sandbox.sandboxId,
                        project.id,
                        cacheKey,
                        log,
                    );

                    step("restore both revisions after snapshotting");
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

            step("populate both revisions with dependencies");
            for (const revision of ["head", "base"] as const) {
                await PreviewDeps.restore_into(
                    sandbox,
                    `${WORKSPACE_DIR}/${revision}`,
                    detect.workspaceDirs,
                );
            }

            step("run the harness agent");
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

            step("read the harness the agent wrote");
            const harness = await PreviewRunner.read_manifest(
                sandbox,
                `${WORKSPACE_DIR}/head/${detect.nextAppDir}`,
            );
            const restored = await PreviewWorkspace.restore_unexpected_edits(
                sandbox,
                `${WORKSPACE_DIR}/head`,
                [],
                log,
            );

            step("apply the harness to the base revision");
            await PreviewWorkspace.copy_harness(
                sandbox,
                `${WORKSPACE_DIR}/head`,
                `${WORKSPACE_DIR}/base`,
                detect.nextAppDir,
            );

            step("start head dev server");
            const head = await this.bring_up_head(sandbox, detect, productDiffId, log);
            if (!head) {
                const reason = detect.hasExistingPagesDir
                    ? "the app's root layout could not render and the project already uses a pages directory"
                    : "the app could not render with placeholder configuration";
                await sandbox.kill();
                sandbox = null;
                const message = `Product Diff could not start this project — ${reason}`;
                await this.settle(productDiffId, "PreviewUnavailable", {
                    error: message,
                    diagnostics: preview_unavailable_diagnostic(
                        "start head dev server",
                        message,
                        previewApplicationPath,
                    ) as unknown as Prisma.InputJsonValue,
                });
                return;
            }
            activeServer = head.server;

            step("verify the head preview surface");
            const headCheck = await PreviewRunner.check(sandbox, {
                baseUrl: head.server.url,
                routePath: head.surface.routePath,
                workspaceRoot: `${WORKSPACE_DIR}/head`,
                nextAppDir: detect.nextAppDir,
            });
            if (!headCheck.ok) {
                const failed = headCheck.results.find((result) => !result.ok);
                throw preview_check_error("head", failed);
            }

            step("photograph the head revision");
            const headShots = await PreviewRunner.capture(sandbox, {
                url: head.server.url,
                routePath: head.surface.routePath,
                side: "head",
                workspaceRoot: `${WORKSPACE_DIR}/head`,
                nextAppDir: detect.nextAppDir,
                outputDir: SHOTS_DIR,
                viewports: VIEWPORTS,
                frozenNowMs: FROZEN_NOW_MS,
                maxShots: MAX_SHOTS,
            });
            const failedHeadShot = headShots.captures.find(
                (capture) => capture.status === "failed",
            );
            if (!headShots.ok || failedHeadShot) {
                throw new Error(
                    `head screenshot validation failed${failedHeadShot ? `: ${failedHeadShot.targetId}/${failedHeadShot.stateId} ${failedHeadShot.error ?? "capture failed"}` : ""}`,
                );
            }

            step("stop the head dev server");
            await PreviewServer.stop(head.server);
            await PreviewRunner.remove_next_preview_surface(sandbox, head.surface);
            activeServer = null;

            step("start base dev server");
            await PreviewRunner.scaffold(sandbox, `${WORKSPACE_DIR}/base`, detect);
            const baseSurface = await PreviewRunner.create_next_preview_surface(sandbox, {
                workspaceRoot: `${WORKSPACE_DIR}/base`,
                applicationPath: detect.nextAppDir,
                routeSegment: head.surface.routePath.slice(1),
                router: head.surface.router,
            });
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
            activeServer = baseServer;
            const baseUsable = await PreviewServer.wait_until_ready(sandbox, baseServer, log);
            if (!baseUsable) {
                const tail = await PreviewServer.log_tail(sandbox, baseServer);
                log.warn("base revision never became ready");
                if (tail) log.block("base dev server output", tail);
                throw new Error(
                    `base revision never became ready${tail ? `: ${diagnostic_summary(tail)}` : ""}`,
                );
            }

            step("verify the base preview surface");
            const baseCheck = await PreviewRunner.check(sandbox, {
                baseUrl: baseServer.url,
                routePath: baseSurface.routePath,
                workspaceRoot: `${WORKSPACE_DIR}/base`,
                nextAppDir: detect.nextAppDir,
            });
            if (!baseCheck.ok) {
                const failed = baseCheck.results.find((result) => !result.ok);
                throw preview_check_error("base", failed);
            }

            step("photograph the base revision");
            const baseShots = await PreviewRunner.capture(sandbox, {
                url: baseServer.url,
                routePath: baseSurface.routePath,
                side: "base",
                workspaceRoot: `${WORKSPACE_DIR}/base`,
                nextAppDir: detect.nextAppDir,
                outputDir: SHOTS_DIR,
                viewports: VIEWPORTS,
                frozenNowMs: FROZEN_NOW_MS,
                maxShots: MAX_SHOTS,
            });
            const failedBaseShot = baseShots.captures.find(
                (capture) => capture.status === "failed",
            );
            if (!baseShots.ok || failedBaseShot) {
                throw new Error(
                    `base screenshot validation failed${failedBaseShot ? `: ${failedBaseShot.targetId}/${failedBaseShot.stateId} ${failedBaseShot.error ?? "capture failed"}` : ""}`,
                );
            }

            step("stop the base dev server");
            await PreviewServer.stop(baseServer);
            await PreviewRunner.remove_next_preview_surface(sandbox, baseSurface);
            activeServer = null;

            step("pair the screenshots");
            const pair = await PreviewRunner.pair(sandbox, headShots.captures, baseShots.captures);
            if (!pair.ok) {
                const first = pair.shots.find((shot) => shot.error)?.error;
                throw new Error(`no target could be rendered${first ? `: ${first}` : ""}`);
            }

            step("recheck the pull request before upload");
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
            step("upload the screenshots");
            await ProductDiffArtifacts.upload(sandbox, SHOTS_DIR, prefix, log);

            step("recheck the pull request after upload");
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
                pair,
                framework: detect.framework,
                viewports: VIEWPORTS,
                warnings,
            });

            step("destroy preview sandbox");
            await sandbox.kill();
            sandbox = null;

            step("publish Product Diff");
            await this.settle(productDiffId, current ? "Ready" : "Stale", {
                manifest: manifest as unknown as Prisma.InputJsonValue,
                artifactPrefix: prefix,
            });
            log.success("Product Diff ready", {
                targets: manifest.targets.length,
                shots: pair.shots.length,
            });
        } catch (error) {
            const diagnostics =
                sandbox && activeServer
                    ? await this.preview_diagnostics(sandbox, activeServer)
                    : "";
            const redactedDiagnostics = redact(diagnostics, [
                githubToken,
                ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN,
            ]);
            if (redactedDiagnostics) {
                log.block("preview diagnostics", redactedDiagnostics);
            }
            if (sandbox) {
                try {
                    await sandbox.kill();
                } catch {
                    // E2B timeout remains final cleanup.
                }
            }
            const failure = describe_product_diff_failure(stage, error);
            const message = sanitize_preview_diagnostic_message(
                redact(
                    redactedDiagnostics
                        ? `${failure} | dev server: ${diagnostic_summary(redactedDiagnostics)}`
                        : failure,
                    [githubToken, ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN],
                ),
            );
            log.error("generation failed", new Error(message));
            const status = product_diff_failure_status(stage);
            await this.settle(
                productDiffId,
                status,
                status === "PreviewUnavailable"
                    ? {
                          error: message,
                          diagnostics: preview_unavailable_diagnostic(
                              stage,
                              message,
                              previewApplicationPath,
                          ) as unknown as Prisma.InputJsonValue,
                      }
                    : { error: message },
            );
        }
    }
}
