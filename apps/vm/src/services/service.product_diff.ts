import { isIP } from "node:net";

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
    ProductDiffPreparedReplayRevision,
    ProductDiffPreparedRevision,
    ProductDiffRunningPreview,
    ProductDiffRunningReplay,
    ProductDiffWorkspacePlan,
} from "./product_diff/adapter.contract";
import ProductDiffAdapterRegistry from "./product_diff/adapter.registry";
import NextPreviewLayoutPolicy from "./product_diff/adapters/next/service.next_preview_layout_policy";
import {
    preview_check_summary,
    type PreviewCheckFailure,
} from "./product_diff/service.preview_check_summary";
import { sanitize_preview_diagnostic_message } from "./product_diff/service.preview_diagnostic_sanitizer";
import ClaudeRun from "./service.claude_run";
import GithubService from "./service.github";
import PreviewDeps from "./service.preview_deps";
import PreviewReplay, { type PreviewReplayCapture } from "./service.preview_replay";
import PreviewRunner, { type PreviewCapture } from "./service.preview_runner";
import PreviewWorkspace from "./service.preview_workspace";
import ProductDiffArtifacts from "./service.product_diff_artifacts";
import ProductDiffReplayArtifacts from "./service.product_diff_replay_artifacts";
import { redact } from "./service.sandbox_stream";

const SANDBOX_TIMEOUT_MS = 55 * 60_000;
const AGENT_TIMEOUT_MS = 15 * 60_000;
const SNAPSHOT_DEADLINE_MS = 30 * 60_000;
const REPO_DIR = "/home/user/repo";
const WORKSPACE_DIR = "/home/user/workspace";
const SHOTS_DIR = "/home/user/output/shots";
const REPLAY_DIR = "/home/user/output/replay";
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

interface PreviewLayoutAttemptFailure {
    rootLayoutMode: "inherit" | "isolate";
    diagnostic: ProductDiffDiagnostic;
}

const PREVIEW_UNAVAILABLE_STAGES = new Set([
    "start head dev server",
    "verify the head preview surface",
    "photograph the head revision",
    "start base dev server",
    "verify the base preview surface",
    "photograph the base revision",
]);

export type ProductDiffGenerationMode = "replay" | "screenshot";

function local_hostname(hostname: string): boolean {
    const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return (
        normalized === "localhost" ||
        normalized.endsWith(".localhost") ||
        normalized === "::1" ||
        /^127(?:\.\d{1,3}){3}$/.test(normalized)
    );
}

function site_boundary(hostname: string): string {
    const labels = hostname.toLowerCase().replace(/\.$/, "").split(".");
    return labels.length < 2 ? labels[0]! : labels.slice(-2).join(".");
}

function clean_origin(value: string): URL | null {
    try {
        const origin = new URL(value);
        if (
            !["http:", "https:"].includes(origin.protocol) ||
            origin.pathname !== "/" ||
            origin.search !== "" ||
            origin.hash !== "" ||
            origin.username !== "" ||
            origin.password !== ""
        ) {
            return null;
        }
        return origin;
    } catch {
        return null;
    }
}

export function select_product_diff_mode(input: {
    replayEnabled: boolean;
    replayOrigin: string | undefined;
    applicationOrigins: string[];
}): ProductDiffGenerationMode {
    if (!input.replayEnabled || !input.replayOrigin) return "screenshot";
    const replayOrigin = clean_origin(input.replayOrigin);
    const applicationOrigins = input.applicationOrigins.map(clean_origin);
    if (!replayOrigin || applicationOrigins.some((origin) => origin === null)) return "screenshot";

    const localDevelopment =
        local_hostname(replayOrigin.hostname) &&
        applicationOrigins.every((origin) => local_hostname(origin!.hostname));
    if (replayOrigin.protocol !== "https:" && !localDevelopment) return "screenshot";
    if (
        !localDevelopment &&
        (isIP(replayOrigin.hostname) !== 0 || !replayOrigin.hostname.includes("."))
    ) {
        return "screenshot";
    }
    if (
        !localDevelopment &&
        applicationOrigins.some(
            (origin) => site_boundary(origin!.hostname) === site_boundary(replayOrigin.hostname),
        )
    ) {
        return "screenshot";
    }
    return "replay";
}

export function configured_product_diff_mode(): ProductDiffGenerationMode {
    return select_product_diff_mode({
        replayEnabled: ENV.SERVER_PRODUCT_DIFF_REPLAY_ENABLED,
        replayOrigin: ENV.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN,
        applicationOrigins: [ENV.SERVER_PUBLIC_API_URL],
    });
}

export function replay_capture_observability(capture: PreviewReplayCapture, surfaceCount: number) {
    const partialReason =
        capture.fidelity === "Unavailable"
            ? "surface-unavailable"
            : capture.fidelity === "Partial" && capture.validationOutcome === "Verified"
              ? "capture-runtime-differences"
              : capture.fidelity === "Partial"
                ? "offline-validation-partial"
                : undefined;
    return {
        revision: capture.revision,
        applicationId: capture.applicationId,
        surfaceId: capture.surfaceId,
        stateId: capture.stateId,
        viewportId: capture.viewportId,
        fidelity: capture.fidelity,
        validationOutcome: capture.validationOutcome,
        partialReason,
        resourceCount: capture.resourceCount,
        packageBytes: capture.packageBytes,
        captureDurationMs: capture.captureDurationMs,
        surfaceCount,
    };
}

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

function layout_attempts_diagnostic(
    workspacePlan: ProductDiffWorkspacePlan,
    attempts: PreviewLayoutAttemptFailure[],
): ProductDiffDiagnostic {
    const summary = attempts
        .map(
            (attempt) =>
                `${attempt.rootLayoutMode} (${attempt.diagnostic.code} at ${attempt.diagnostic.stage})`,
        )
        .join(", ");
    return static_diagnostic(
        "PREVIEW_LAYOUT_ATTEMPTS_FAILED",
        "preview-layout",
        `Preview layout attempts failed: ${summary}.`,
        "next",
        workspacePlan.applicationPath,
        workspacePlan.workspaceKind,
    );
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
    replayEnabled: boolean;
    applications?: { applicationPath: string; framework: string }[];
}): string {
    const applicationRoot = `${WORKSPACE_DIR}/head/${input.applicationPath}`;
    const replayApplications = input.applications ?? [
        { applicationPath: input.applicationPath, framework: input.framework },
    ];
    const replayApplicationRoots = replayApplications
        .map(
            (application) =>
                `  ${WORKSPACE_DIR}/head/${application.applicationPath}   (${application.framework})`,
        )
        .join("\n");
    const writableReplayRoots = replayApplications
        .map(
            (application) => `${WORKSPACE_DIR}/head/${application.applicationPath}/matcha_preview/`,
        )
        .join("\n  ");

    return `You are preparing a visual preview for a pull request. You will NOT draw anything.
You write React that mounts the project's REAL components with fixed data.

Revisions
  base commit:   ${input.baseSha}
  head commit:   ${input.headSha}
  base worktree: ${WORKSPACE_DIR}/base
  head worktree: ${WORKSPACE_DIR}/head
  application:   ${applicationRoot}   (${input.framework})
${input.replayEnabled ? `  replay applications:\n${replayApplicationRoots}` : ""}

Work only inside ${input.replayEnabled ? `these generated preview folders:\n  ${writableReplayRoots}\n  ${WORKSPACE_DIR}/head/matcha_preview/` : `${applicationRoot}/matcha_preview/`}. You write ${input.replayEnabled ? "exactly three" : "exactly two"} kinds of file there:
  targets/<targetId>.tsx   one per target
  manifest.json            the index of targets
${input.replayEnabled ? `  ${WORKSPACE_DIR}/head/matcha_preview/review-plan.json   the single declarative replay plan` : ""}

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
  sourcePath is relative to ${input.applicationPath}.
  At most 4 targets and at most 4 states each.
  label is at most 80 characters, for both a target and a state.
  Put anything a reviewer should distrust into warnings, as short one-line notes.
  At most 20 warnings, each at most 300 characters. Split a long note into several short ones.

${
    input.replayEnabled
        ? `Step 4 - write ${WORKSPACE_DIR}/head/matcha_preview/review-plan.json
  Declare every replay application listed above using its repository-relative applicationPath and adapterId "next".
  Put each target and manifest in that application's own matcha_preview folder. Declare one surface per review target. A component surface entry is { "kind": "component", "targetId": "<targetId>" }.
  A route surface entry is { "kind": "route", "path": "/route" }.
  Every surface includes id, its declared applicationId, label, sourcePaths, entry, rootLayoutMode,
  states, and viewports. Use only inherit or isolate for rootLayoutMode. Use semantic click, fill,
  select, check, and waitFor actions. Never include script or JavaScript source. Use one desktop
  viewport { "id": "desktop", "label": "Desktop", "width": 1280, "height": 800 } unless the
  reviewed behavior specifically needs another size. Keep identifiers lowercase and hyphenated.

Step 5 - finish the harness.`
        : "Step 4 - finish the harness."
}
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

    static async run(productDiffId: string): Promise<ProductDiffTerminalStatus | null> {
        const claim = await prisma.productDiff.updateMany({
            where: { id: productDiffId, status: "Pending" },
            data: { status: "Generating", error: null, diagnostics: Prisma.JsonNull },
        });
        if (claim.count === 0) return null;

        const log = Logger.scope(`product-diff:${productDiffId.slice(-8)}`);
        const startedAt = Date.now();
        const generationMode = configured_product_diff_mode();
        let sandbox: Sandbox | null = null;
        let adapter: ProductDiffAdapter | null = null;
        let headPrepared: ProductDiffPreparedRevision | null = null;
        let basePrepared: ProductDiffPreparedRevision | null = null;
        let headPreview: ProductDiffRunningPreview | null = null;
        let basePreview: ProductDiffRunningPreview | null = null;
        let headReplayPrepared: ProductDiffPreparedReplayRevision | null = null;
        let baseReplayPrepared: ProductDiffPreparedReplayRevision | null = null;
        let headReplayPreview: ProductDiffRunningReplay | null = null;
        let baseReplayPreview: ProductDiffRunningReplay | null = null;
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
            await sandbox.commands.run(`mkdir -p ${SHOTS_DIR} ${REPLAY_DIR}`);

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
                return "Unsupported";
            }

            const detection = await adapter.detect({
                workspaceRoot: headWorkspaceRoot,
                changedPaths,
                configuration,
            });
            const resolutionInput = {
                workspaceRoot: headWorkspaceRoot,
                changedPaths,
                configuration,
                detection,
            };
            const replayResolution =
                generationMode === "replay" && adapter.resolve_replay_workspaces
                    ? await adapter.resolve_replay_workspaces(resolutionInput)
                    : null;
            const resolution = replayResolution
                ? {
                      plan: replayResolution.plans[0] ?? null,
                      diagnostics: replayResolution.diagnostics,
                  }
                : await adapter.resolve_workspace(resolutionInput);
            const workspacePlans =
                replayResolution?.plans ?? (resolution.plan ? [resolution.plan] : []);
            if (!resolution.plan || workspacePlans.length === 0) {
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
                return "ConfigurationRequired";
            }
            const workspacePlan = resolution.plan;

            step("prepare both revisions");
            for (const [index, applicationPlan] of workspacePlans.entries()) {
                const preparedHead = await adapter.prepare_revision({
                    revision: "head",
                    workspaceRoot: headWorkspaceRoot,
                    plan: applicationPlan,
                });
                const preparedBase = await adapter.prepare_revision({
                    revision: "base",
                    workspaceRoot: baseWorkspaceRoot,
                    plan: applicationPlan,
                });
                if (index === 0) {
                    headPrepared = preparedHead;
                    basePrepared = preparedBase;
                }
            }

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
                    for (const [index, applicationPlan] of workspacePlans.entries()) {
                        const preparedHead = await adapter.prepare_revision({
                            revision: "head",
                            workspaceRoot: headWorkspaceRoot,
                            plan: applicationPlan,
                        });
                        const preparedBase = await adapter.prepare_revision({
                            revision: "base",
                            workspaceRoot: baseWorkspaceRoot,
                            plan: applicationPlan,
                        });
                        if (index === 0) {
                            headPrepared = preparedHead;
                            basePrepared = preparedBase;
                        }
                    }
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
                    replayEnabled: generationMode === "replay",
                    applications: workspacePlans.map((applicationPlan) => ({
                        applicationPath: applicationPlan.applicationPath,
                        framework: applicationPlan.framework,
                    })),
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
            const replayPlan =
                generationMode === "replay"
                    ? await PreviewRunner.read_replay_plan(sandbox, headWorkspaceRoot)
                    : null;
            const restored = await PreviewWorkspace.restore_unexpected_edits(
                sandbox,
                headWorkspaceRoot,
                [],
                log,
            );
            const harnessApplicationPaths = replayPlan
                ? [
                      ".",
                      ...replayPlan.applications.map((application) => application.applicationPath),
                  ]
                : [workspacePlan.applicationPath];
            for (const applicationPath of [...new Set(harnessApplicationPaths)]) {
                await PreviewWorkspace.copy_harness(
                    sandbox,
                    headWorkspaceRoot,
                    baseWorkspaceRoot,
                    applicationPath,
                );
            }

            if (replayPlan) {
                const revisions = [
                    {
                        revision: "head" as const,
                        port: HEAD_PORT,
                        workspaceRoot: headWorkspaceRoot,
                    },
                    {
                        revision: "base" as const,
                        port: BASE_PORT,
                        workspaceRoot: baseWorkspaceRoot,
                    },
                ];
                const capturedByRevision = new Map<"head" | "base", PreviewReplayCapture[]>();
                const workspacePlansByApplicationPath = new Map(
                    workspacePlans.map((applicationPlan) => [
                        applicationPlan.applicationPath,
                        applicationPlan,
                    ]),
                );

                for (const revision of revisions) {
                    const revisionCaptures: PreviewReplayCapture[] = [];
                    for (const application of replayPlan.applications) {
                        const applicationSurfaces = replayPlan.surfaces.filter(
                            (surface) => surface.applicationId === application.id,
                        );
                        if (applicationSurfaces.length === 0) continue;
                        const applicationPlan = workspacePlansByApplicationPath.get(
                            application.applicationPath,
                        );
                        if (!applicationPlan || application.adapterId !== adapter.id) {
                            const unavailableCaptures = PreviewReplay.unavailable(
                                revision.revision,
                                { applications: [application], surfaces: applicationSurfaces },
                                "declared replay application could not be resolved",
                            );
                            revisionCaptures.push(...unavailableCaptures);
                            for (const capture of unavailableCaptures) {
                                log.info(
                                    "product diff replay surface captured",
                                    replay_capture_observability(
                                        capture,
                                        replayPlan.surfaces.length,
                                    ),
                                );
                            }
                            continue;
                        }

                        const layoutModes = [
                            ...new Set(
                                applicationSurfaces.map((surface) => surface.rootLayoutMode),
                            ),
                        ];
                        for (const rootLayoutMode of layoutModes) {
                            const selectedPlan = {
                                applications: [application],
                                surfaces: applicationSurfaces.filter(
                                    (surface) => surface.rootLayoutMode === rootLayoutMode,
                                ),
                            };
                            let preparedRevision: ProductDiffPreparedReplayRevision | null = null;
                            let preview: ProductDiffRunningReplay | null = null;
                            try {
                                step(
                                    `build ${revision.revision} replay for ${application.applicationPath}`,
                                );
                                preparedRevision = await adapter.prepare_replay_revision({
                                    revision: revision.revision,
                                    workspaceRoot: revision.workspaceRoot,
                                    plan: applicationPlan,
                                    rebuildHarnessRegistry: true,
                                    rootLayoutMode,
                                });
                                if (revision.revision === "head") {
                                    headReplayPrepared = preparedRevision;
                                } else {
                                    baseReplayPrepared = preparedRevision;
                                }

                                step(
                                    `start ${revision.revision} replay for ${application.applicationPath}`,
                                );
                                preview = await adapter.start_replay_revision({
                                    revision: revision.revision,
                                    workspaceRoot: revision.workspaceRoot,
                                    plan: applicationPlan,
                                    preparedRevision,
                                    port: revision.port,
                                });
                                if (revision.revision === "head") headReplayPreview = preview;
                                else baseReplayPreview = preview;

                                step(
                                    `capture ${revision.revision} replay for ${application.applicationPath}`,
                                );
                                const surfaceCaptures = await PreviewReplay.capture(sandbox, {
                                    revision: revision.revision,
                                    preview,
                                    plan: selectedPlan,
                                    artifactRoot: REPLAY_DIR,
                                    dataPolicy: configuration?.replayDataPolicy,
                                });
                                revisionCaptures.push(...surfaceCaptures);
                                for (const capture of surfaceCaptures) {
                                    log.info(
                                        "product diff replay surface captured",
                                        replay_capture_observability(
                                            capture,
                                            replayPlan.surfaces.length,
                                        ),
                                    );
                                }
                            } catch {
                                const unavailableCaptures = PreviewReplay.unavailable(
                                    revision.revision,
                                    selectedPlan,
                                    "replay revision could not be built or captured",
                                );
                                revisionCaptures.push(...unavailableCaptures);
                                for (const capture of unavailableCaptures) {
                                    log.info(
                                        "product diff replay surface captured",
                                        replay_capture_observability(
                                            capture,
                                            replayPlan.surfaces.length,
                                        ),
                                    );
                                }
                            } finally {
                                step(
                                    `stop ${revision.revision} replay for ${application.applicationPath}`,
                                );
                                await adapter.cleanup_replay_revision({
                                    revision: revision.revision,
                                    workspaceRoot: revision.workspaceRoot,
                                    preparedRevision,
                                    preview,
                                });
                                if (revision.revision === "head") {
                                    headReplayPrepared = null;
                                    headReplayPreview = null;
                                } else {
                                    baseReplayPrepared = null;
                                    baseReplayPreview = null;
                                }
                            }
                        }
                    }
                    capturedByRevision.set(revision.revision, revisionCaptures);
                }

                const captures = revisions.flatMap((revision) => {
                    step(`validate ${revision.revision} replay`);
                    return PreviewReplay.validate(
                        revision.revision,
                        capturedByRevision.get(revision.revision) ?? [],
                    );
                });
                const manifest = ProductDiffReplayArtifacts.build_manifest({
                    plan: replayPlan,
                    framework: framework_from_plan(workspacePlan),
                    captures,
                    warnings: restored.length
                        ? [`the agent edited ${restored.length} file(s) outside its harness folder`]
                        : [],
                });
                if (!ProductDiffReplayArtifacts.has_valid_result(manifest)) {
                    throw new ProductDiffPreviewUnavailableError(
                        static_diagnostic(
                            "REPLAY_NO_VALID_SURFACE",
                            "replay-validation",
                            "No replay surface passed offline validation.",
                            adapter.id,
                            workspacePlan.applicationPath,
                            workspacePlan.workspaceKind,
                        ),
                    );
                }
                step("recheck the pull request before replay upload");
                const beforeUpload = await GithubService.getPullRequest(
                    githubToken,
                    project.githubRepoFullName,
                    productDiff.pullNumber,
                );
                if (
                    !is_current_product_diff(beforeUpload, productDiff.baseSha, productDiff.headSha)
                ) {
                    await this.settle(productDiffId, "Stale");
                    return "Stale";
                }

                const prefix = `product-diffs/${project.id}/${productDiff.pullNumber}/${productDiff.baseSha}-${productDiff.headSha}/${productDiff.id}`;
                step("upload replay artifacts");
                try {
                    await ProductDiffReplayArtifacts.upload(
                        sandbox,
                        REPLAY_DIR,
                        prefix,
                        manifest,
                        log,
                    );
                } catch {
                    throw new ProductDiffPreviewUnavailableError(
                        static_diagnostic(
                            "REPLAY_UPLOAD_UNAVAILABLE",
                            "replay-upload",
                            "Replay artifacts could not be published.",
                            adapter.id,
                            workspacePlan.applicationPath,
                            workspacePlan.workspaceKind,
                        ),
                    );
                }

                step("recheck the pull request after replay upload");
                const afterUpload = await GithubService.getPullRequest(
                    githubToken,
                    project.githubRepoFullName,
                    productDiff.pullNumber,
                );
                if (
                    !is_current_product_diff(afterUpload, productDiff.baseSha, productDiff.headSha)
                ) {
                    await this.settle(productDiffId, "Stale");
                    return "Stale";
                }
                await this.settle(productDiffId, "Ready", {
                    manifest: manifest as unknown as Prisma.InputJsonValue,
                    artifactPrefix: prefix,
                });
                return "Ready";
            }

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

            const capture_attempt = async (rootLayoutMode: "inherit" | "isolate") => {
                const revisions = [
                    {
                        revision: "head" as const,
                        port: HEAD_PORT,
                        workspaceRoot: headWorkspaceRoot,
                        preparedRevision: headPrepared!,
                    },
                    {
                        revision: "base" as const,
                        port: BASE_PORT,
                        workspaceRoot: baseWorkspaceRoot,
                        preparedRevision: basePrepared!,
                    },
                ];
                const captures = new Map<"head" | "base", PreviewCapture>();

                for (const revision of revisions) {
                    let preview: ProductDiffRunningPreview | null = null;
                    try {
                        step(`start ${revision.revision} preview`);
                        preview = await adapter!.start_revision({
                            revision: revision.revision,
                            workspaceRoot: revision.workspaceRoot,
                            plan: workspacePlan,
                            preparedRevision: revision.preparedRevision,
                            port: revision.port,
                            rootLayoutMode,
                        });
                        if (revision.revision === "head") headPreview = preview;
                        else basePreview = preview;

                        step(`verify ${revision.revision} preview`);
                        const health = await adapter!.verify_revision({
                            preview,
                            plan: workspacePlan,
                        });
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

                        step(`capture ${revision.revision} preview`);
                        let capture: PreviewCapture;
                        try {
                            capture = await PreviewRunner.capture(sandbox!, {
                                url: preview.url,
                                routePath: preview.surfacePath,
                                side: revision.revision,
                                workspaceRoot: revision.workspaceRoot,
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
                        captures.set(revision.revision, capture);
                    } finally {
                        await this.cleanup_revision(
                            adapter!,
                            revision.revision,
                            revision.workspaceRoot,
                            revision.preparedRevision,
                            preview,
                        );
                        if (revision.revision === "head") headPreview = null;
                        else basePreview = null;
                    }
                }

                return { headShots: captures.get("head")!, baseShots: captures.get("base")! };
            };

            const router = workspacePlan.router === "PagesRouter" ? "PagesRouter" : "AppRouter";
            const layoutModes = NextPreviewLayoutPolicy.attempt_modes(
                router,
                workspacePlan.rootLayoutMode,
            );
            let captures: { headShots: PreviewCapture; baseShots: PreviewCapture } | null = null;
            const layoutFailures: PreviewLayoutAttemptFailure[] = [];
            for (const rootLayoutMode of layoutModes) {
                try {
                    captures = await capture_attempt(rootLayoutMode);
                    break;
                } catch (error) {
                    const diagnostic =
                        error instanceof ProductDiffPreviewUnavailableError
                            ? error.diagnostic
                            : static_diagnostic(
                                  "PREVIEW_LAYOUT_ATTEMPT_FAILED",
                                  "preview-layout",
                                  "The preview layout attempt failed.",
                                  adapter!.id,
                                  workspacePlan.applicationPath,
                                  workspacePlan.workspaceKind,
                              );
                    layoutFailures.push({ rootLayoutMode, diagnostic });
                    if (rootLayoutMode === layoutModes.at(-1)) {
                        if (layoutFailures.length === 1) throw error;
                        throw new ProductDiffPreviewUnavailableError(
                            layout_attempts_diagnostic(workspacePlan, layoutFailures),
                        );
                    }
                    log.warn("preview layout attempt failed; retrying with inherited layout", {
                        applicationPath: workspacePlan.applicationPath,
                        workspaceKind: workspacePlan.workspaceKind,
                        failedRootLayoutMode: rootLayoutMode,
                        nextRootLayoutMode: layoutModes.at(-1),
                        diagnosticCode: diagnostic.code,
                        diagnosticStage: diagnostic.stage,
                    });
                }
            }
            if (!captures) throw new Error("preview layout attempts did not produce captures");
            const { headShots, baseShots } = captures;

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
                return "Stale";
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
                return "Stale";
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
            return "Ready";
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
            return status;
        } finally {
            if (adapter) {
                await adapter
                    .cleanup_replay_revision({
                        revision: "head",
                        workspaceRoot: headWorkspaceRoot,
                        preparedRevision: headReplayPrepared,
                        preview: headReplayPreview,
                    })
                    .catch(() => undefined);
                await adapter
                    .cleanup_replay_revision({
                        revision: "base",
                        workspaceRoot: baseWorkspaceRoot,
                        preparedRevision: baseReplayPrepared,
                        preview: baseReplayPreview,
                    })
                    .catch(() => undefined);
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
