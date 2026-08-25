import { Prisma, prisma } from "@trymatcha/database";
import Logger from "@trymatcha/logger";
import type {
    ProductDiffDiagnostic,
    ProductDiffPreviewConfiguration,
    ProductDiffViewport,
} from "@trymatcha/types";
import { Sandbox } from "e2b";

import { ENV } from "../conf/config.env";
import type {
    ProductDiffAdapter,
    ProductDiffPreparedRevision,
    ProductDiffRunningPreview,
    ProductDiffWorkspacePlan,
} from "./product_diff/adapter.contract";
import ProductDiffAdapterRegistry from "./product_diff/adapter.registry";
import {
    preview_check_summary,
    type PreviewCheckFailure,
} from "./product_diff/service.preview_check_summary";
import { sanitize_preview_diagnostic_message } from "./product_diff/service.preview_diagnostic_sanitizer";
import ClaudeRun from "./service.claude_run";
import GithubService from "./service.github";
import PreviewDeps from "./service.preview_deps";
import PreviewRunner, { type PreviewCapture } from "./service.preview_runner";
import PreviewWorkspace from "./service.preview_workspace";
import ProductDiffArtifacts from "./service.product_diff_artifacts";
import { redact } from "./service.sandbox_stream";

const SANDBOX_TIMEOUT_MS = 55 * 60_000;
const AGENT_TIMEOUT_MS = 15 * 60_000;
const SNAPSHOT_DEADLINE_MS = 30 * 60_000;
const REPO_DIR = "/home/user/repo";
const WORKSPACE_DIR = "/home/user/workspace";
const SHOTS_DIR = "/home/user/output/shots";
const PROMPT_PATH = "/home/user/product_diff_prompt.txt";
const HEAD_PORT = 41337;
const BASE_PORT = 41338;
const MAX_SHOTS = 48;
const FROZEN_NOW_MS = 1_750_000_000_000;
const CAPTURE_SETTLE_MS = 1_000;
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

type ProductDiffTerminalStatus =
    "Ready" | "Stale" | "Failed" | "Unsupported" | "ConfigurationRequired" | "PreviewUnavailable";

class ProductDiffPreviewUnavailableError extends Error {
    constructor(readonly diagnostic: ProductDiffDiagnostic) {
        super(diagnostic.message);
    }
}

class ProductDiffInternalError extends Error {
    constructor(readonly diagnostic: ProductDiffDiagnostic) {
        super(diagnostic.message);
    }
}

class PreviewCheckError extends Error {}

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
    failed: (PreviewCheckFailure & { detail: string | null }) | undefined,
    routePath: string,
): Error {
    return new PreviewCheckError(preview_check_summary(revision, failed, routePath));
}

export function preview_unavailable_error_message(stage: string, error: unknown): string {
    if (error instanceof PreviewCheckError) return error.message;
    const safeStage = PREVIEW_UNAVAILABLE_STAGES.has(stage) ? stage : "preview";
    return `Preview unavailable during ${safeStage}.`;
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

function static_diagnostic(
    code: string,
    stage: string,
    message: string,
    adapter: string | null = null,
    applicationPath: string | null = null,
    workspaceKind: string | null = null,
): ProductDiffDiagnostic {
    return { code, stage, message, adapter, applicationPath, workspaceKind };
}

function framework_from_plan(plan: ProductDiffWorkspacePlan): "NextAppRouter" | "NextPagesRouter" {
    return plan.framework === "NextPagesRouter" ? "NextPagesRouter" : "NextAppRouter";
}

function failure_message(stage: string): string {
    return `Product Diff failed during ${stage}.`;
}

function prompt(input: {
    baseSha: string;
    headSha: string;
    applicationPath: string;
    framework: string;
}): string {
    const applicationRoot = `${WORKSPACE_DIR}/head/${input.applicationPath}`;

    return `You are preparing a visual preview for a pull request. You will NOT draw anything.
You write React that mounts the project's REAL components with fixed data.

Revisions
  base commit:   ${input.baseSha}
  head commit:   ${input.headSha}
  base worktree: ${WORKSPACE_DIR}/base
  head worktree: ${WORKSPACE_DIR}/head
  application:   ${applicationRoot}   (${input.framework})

Work only inside ${applicationRoot}/matcha_preview/. You write exactly two kinds of file there:
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
    "rootLayoutMode": "inherit",
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
  sourcePath is relative to ${input.applicationPath}.
  At most 4 targets and at most 4 states each.
  label is at most 80 characters, for both a target and a state.
  rootLayoutMode applies to every target in this Product Diff. Use "inherit" if any target needs
  the application's root layout, fonts, provider, theme, i18n, auth, or data context. Use
  "isolate" only when every target renders from deterministic local fixtures without root-layout
  context. When uncertain, use "inherit".
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
        status: ProductDiffTerminalStatus,
        data: Prisma.ProductDiffUpdateManyMutationInput = {},
    ): Promise<void> {
        await prisma.productDiff.updateMany({
            where: { id: productDiffId, status: "Generating" },
            data: { status, ...data },
        });
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
                if (await PreviewRunner.supports_current_protocol(warm)) return warm;

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

    private static async cleanup_revision(
        adapter: ProductDiffAdapter,
        revision: "head" | "base",
        workspaceRoot: string,
        preparedRevision: ProductDiffPreparedRevision | null,
        preview: ProductDiffRunningPreview | null,
    ): Promise<void> {
        await adapter.cleanup_revision({ revision, workspaceRoot, preparedRevision, preview });
    }

    static async run(productDiffId: string): Promise<void> {
        const claim = await prisma.productDiff.updateMany({
            where: { id: productDiffId, status: "Pending" },
            data: { status: "Generating", error: null, diagnostics: Prisma.JsonNull },
        });
        if (claim.count === 0) return;

        const log = Logger.scope(`product-diff:${productDiffId.slice(-8)}`);
        const startedAt = Date.now();
        let sandbox: Sandbox | null = null;
        let adapter: ProductDiffAdapter | null = null;
        let headPrepared: ProductDiffPreparedRevision | null = null;
        let basePrepared: ProductDiffPreparedRevision | null = null;
        let headPreview: ProductDiffRunningPreview | null = null;
        let basePreview: ProductDiffRunningPreview | null = null;
        let headWorkspaceRoot = "";
        let baseWorkspaceRoot = "";
        let githubToken = "";
        let stage = "load Product Diff";
        const step = (name: string) => {
            stage = name;
            log.step(name);
        };

        try {
            const productDiff = await prisma.productDiff.findUniqueOrThrow({
                where: { id: productDiffId },
                include: {
                    issue: {
                        include: {
                            project: { include: { githubInstallation: true, projectConfig: true } },
                        },
                    },
                },
            });
            const project = productDiff.issue.project;
            const configuration = project.projectConfig?.productDiffPreviewConfig as
                ProductDiffPreviewConfiguration | null | undefined;

            step("validate Product Diff metadata");
            if (
                !project.githubRepoFullName ||
                !project.githubRepoId ||
                !project.githubInstallation ||
                !SAFE_REPOSITORY.test(project.githubRepoFullName) ||
                !SAFE_SHA.test(productDiff.baseSha) ||
                !SAFE_SHA.test(productDiff.headSha)
            ) {
                throw new Error("invalid Product Diff repository metadata");
            }

            step("create GitHub installation token");
            githubToken = await GithubService.getInstallationToken(
                Number(project.githubInstallation.installationId),
                Number(project.githubRepoId),
            );

            step("start preview sandbox");
            sandbox = await this.start_sandbox(project.previewSnapshotId, project.id, log);
            await sandbox.commands.run(`mkdir -p ${SHOTS_DIR}`);

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

            step("select Product Diff adapter");
            const changedPaths = await PreviewWorkspace.changed_paths(
                sandbox,
                REPO_DIR,
                productDiff.baseSha,
                productDiff.headSha,
            );
            headWorkspaceRoot = `${WORKSPACE_DIR}/head`;
            baseWorkspaceRoot = `${WORKSPACE_DIR}/base`;
            const registry = ProductDiffAdapterRegistry.registered({
                sandbox,
                projectId: project.id,
                log,
                environment: SERVER_ENV,
            });
            adapter = await registry.resolve({
                workspaceRoot: headWorkspaceRoot,
                changedPaths,
                configuration,
            });
            if (!adapter) {
                await this.settle(productDiffId, "Unsupported", {
                    error: "No installed Product Diff adapter supports this project.",
                    diagnostics: static_diagnostic(
                        "PRODUCT_DIFF_ADAPTER_UNSUPPORTED",
                        "adapter-selection",
                        "No installed Product Diff adapter supports this project.",
                    ) as unknown as Prisma.InputJsonValue,
                });
                return;
            }

            const detection = await adapter.detect({
                workspaceRoot: headWorkspaceRoot,
                changedPaths,
                configuration,
            });
            const resolution = await adapter.resolve_workspace({
                workspaceRoot: headWorkspaceRoot,
                changedPaths,
                configuration,
                detection,
            });
            if (!resolution.plan) {
                await this.settle(productDiffId, "ConfigurationRequired", {
                    error: "Product Diff needs preview configuration for this project.",
                    diagnostics: (resolution.diagnostics[0] ??
                        static_diagnostic(
                            "PRODUCT_DIFF_CONFIGURATION_REQUIRED",
                            "workspace-resolution",
                            "Product Diff needs preview configuration for this project.",
                            adapter.id,
                        )) as unknown as Prisma.InputJsonValue,
                });
                return;
            }
            const workspacePlan = resolution.plan;

            step("prepare both revisions");
            headPrepared = await adapter.prepare_revision({
                revision: "head",
                workspaceRoot: headWorkspaceRoot,
                plan: workspacePlan,
            });
            basePrepared = await adapter.prepare_revision({
                revision: "base",
                workspaceRoot: baseWorkspaceRoot,
                plan: workspacePlan,
            });

            step("install dependencies");
            const cacheKey = PreviewDeps.cache_key(workspacePlan.dependency);
            const warmCache =
                project.previewDepsHash === cacheKey && (await PreviewDeps.cache_present(sandbox));
            if (!warmCache) {
                await PreviewDeps.install(sandbox, headWorkspaceRoot, workspacePlan, log);
                await PreviewDeps.move_to_cache(
                    sandbox,
                    headWorkspaceRoot,
                    workspacePlan.dependency.workspaceDirs,
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
                    headPrepared = await adapter.prepare_revision({
                        revision: "head",
                        workspaceRoot: headWorkspaceRoot,
                        plan: workspacePlan,
                    });
                    basePrepared = await adapter.prepare_revision({
                        revision: "base",
                        workspaceRoot: baseWorkspaceRoot,
                        plan: workspacePlan,
                    });
                }
            }

            step("populate both revisions with dependencies");
            for (const worktree of [headWorkspaceRoot, baseWorkspaceRoot]) {
                await PreviewDeps.restore_into(
                    sandbox,
                    worktree,
                    workspacePlan.dependency.workspaceDirs,
                );
            }

            step("run the harness agent");
            await sandbox.files.write(
                PROMPT_PATH,
                prompt({
                    baseSha: productDiff.baseSha,
                    headSha: productDiff.headSha,
                    applicationPath: workspacePlan.applicationPath,
                    framework: workspacePlan.framework,
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
            const applicationRoot = `${headWorkspaceRoot}/${workspacePlan.applicationPath}`;
            const harness = await PreviewRunner.read_manifest(sandbox, applicationRoot);
            const restored = await PreviewWorkspace.restore_unexpected_edits(
                sandbox,
                headWorkspaceRoot,
                [],
                log,
            );
            await PreviewWorkspace.copy_harness(
                sandbox,
                headWorkspaceRoot,
                baseWorkspaceRoot,
                workspacePlan.applicationPath,
            );
            headPrepared = await adapter.prepare_revision({
                revision: "head",
                workspaceRoot: headWorkspaceRoot,
                plan: workspacePlan,
                rebuildHarnessRegistry: true,
            });
            basePrepared = await adapter.prepare_revision({
                revision: "base",
                workspaceRoot: baseWorkspaceRoot,
                plan: workspacePlan,
                rebuildHarnessRegistry: true,
            });

            const capture_revision = async (
                revision: "head" | "base",
                port: number,
                preparedRevision: ProductDiffPreparedRevision,
            ): Promise<PreviewCapture> => {
                const workspaceRoot = revision === "head" ? headWorkspaceRoot : baseWorkspaceRoot;
                step(`start ${revision} preview`);
                const preview = await adapter!.start_revision({
                    revision,
                    workspaceRoot,
                    plan: workspacePlan,
                    preparedRevision,
                    port,
                    rootLayoutMode: harness.rootLayoutMode,
                });
                if (revision === "head") headPreview = preview;
                else basePreview = preview;

                step(`verify ${revision} preview`);
                const health = await adapter!.verify_revision({ preview, plan: workspacePlan });
                if (!health.ready) {
                    throw new ProductDiffPreviewUnavailableError(
                        health.diagnostics[0] ??
                            static_diagnostic(
                                "PREVIEW_UNAVAILABLE",
                                "preview-verification",
                                "The preview could not be verified.",
                                adapter!.id,
                                workspacePlan.applicationPath,
                                workspacePlan.workspaceKind,
                            ),
                    );
                }

                step(`capture ${revision} preview`);
                let capture: PreviewCapture;
                try {
                    capture = await PreviewRunner.capture(sandbox!, {
                        url: preview.url,
                        routePath: preview.surfacePath,
                        side: revision,
                        workspaceRoot,
                        nextAppDir: workspacePlan.applicationPath,
                        outputDir: SHOTS_DIR,
                        viewports: VIEWPORTS,
                        frozenNowMs: FROZEN_NOW_MS,
                        settleMs: CAPTURE_SETTLE_MS,
                        maxShots: MAX_SHOTS,
                    });
                } catch {
                    throw new ProductDiffPreviewUnavailableError(
                        static_diagnostic(
                            "PREVIEW_CAPTURE_UNAVAILABLE",
                            "capture",
                            "The verified preview could not be captured.",
                            adapter!.id,
                            workspacePlan.applicationPath,
                            workspacePlan.workspaceKind,
                        ),
                    );
                }
                const failed = capture.captures.find((shot) => shot.status === "failed");
                if (!capture.ok || failed) {
                    throw new ProductDiffPreviewUnavailableError(
                        static_diagnostic(
                            "PREVIEW_CAPTURE_UNAVAILABLE",
                            "capture",
                            "The verified preview could not be captured.",
                            adapter!.id,
                            workspacePlan.applicationPath,
                            workspacePlan.workspaceKind,
                        ),
                    );
                }
                await this.cleanup_revision(
                    adapter!,
                    revision,
                    workspaceRoot,
                    preparedRevision,
                    preview,
                );
                if (revision === "head") headPreview = null;
                else basePreview = null;
                return capture;
            };

            const headShots = await capture_revision("head", HEAD_PORT, headPrepared);
            const baseShots = await capture_revision("base", BASE_PORT, basePrepared);

            step("pair the screenshots");
            const pair = await PreviewRunner.pair(sandbox, headShots.captures, baseShots.captures);
            if (!pair.ok) {
                throw new ProductDiffInternalError(
                    static_diagnostic(
                        "PRODUCT_DIFF_PAIRING_FAILED",
                        "pairing",
                        "The screenshot pairing service failed.",
                        adapter.id,
                        workspacePlan.applicationPath,
                        workspacePlan.workspaceKind,
                    ),
                );
            }

            step("recheck the pull request before upload");
            const beforeUpload = await GithubService.getPullRequest(
                githubToken,
                project.githubRepoFullName,
                productDiff.pullNumber,
            );
            if (!is_current_product_diff(beforeUpload, productDiff.baseSha, productDiff.headSha)) {
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
            if (!current) {
                await this.settle(productDiffId, "Stale");
                return;
            }
            const manifest = ProductDiffArtifacts.build_manifest({
                harness,
                pair,
                framework: framework_from_plan(workspacePlan),
                viewports: VIEWPORTS,
                warnings: restored.length
                    ? [`the agent edited ${restored.length} file(s) outside its harness folder`]
                    : [],
                adapter: {
                    id: adapter.id,
                    applicationPath: workspacePlan.applicationPath,
                    workspaceKind: workspacePlan.workspaceKind,
                    router: workspacePlan.router,
                },
                diagnostics: resolution.diagnostics,
            });
            await this.settle(productDiffId, "Ready", {
                manifest: manifest as unknown as Prisma.InputJsonValue,
                artifactPrefix: prefix,
            });
        } catch (error) {
            const previewError = error instanceof ProductDiffPreviewUnavailableError ? error : null;
            const internalError = error instanceof ProductDiffInternalError ? error : null;
            const status: ProductDiffTerminalStatus = previewError
                ? "PreviewUnavailable"
                : "Failed";
            const diagnostic =
                previewError?.diagnostic ??
                internalError?.diagnostic ??
                static_diagnostic(
                    "PRODUCT_DIFF_RUN_FAILED",
                    "orchestration",
                    failure_message(stage),
                    adapter?.id ?? null,
                );
            const safeRuntimeMessage = error instanceof Error ? error.message : String(error);
            log.error(
                "generation failed",
                new Error(
                    redact(safeRuntimeMessage, [githubToken, ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN]),
                ),
            );
            await this.settle(productDiffId, status, {
                error:
                    previewError?.diagnostic.message ??
                    internalError?.diagnostic.message ??
                    failure_message(stage),
                diagnostics: diagnostic as unknown as Prisma.InputJsonValue,
            });
        } finally {
            if (adapter) {
                await this.cleanup_revision(
                    adapter,
                    "head",
                    headWorkspaceRoot,
                    headPrepared,
                    headPreview,
                ).catch(() => undefined);
                await this.cleanup_revision(
                    adapter,
                    "base",
                    baseWorkspaceRoot,
                    basePrepared,
                    basePreview,
                ).catch(() => undefined);
            }
            await sandbox?.kill().catch(() => undefined);
        }
    }
}
