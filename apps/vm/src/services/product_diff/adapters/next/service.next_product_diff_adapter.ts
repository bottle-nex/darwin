import { posix } from "node:path";

import type { ProductDiffDiagnostic } from "@trymatcha/types";

import PreviewRunner, {
    type NextWorkspaceInspection,
    type PreviewSurface,
} from "../../../service.preview_runner";
import PreviewServer, { type PreviewServerHandle } from "../../../service.preview_server";
import PreviewWorkspace from "../../../service.preview_workspace";
import type {
    ProductDiffAdapter,
    ProductDiffAdapterDetection,
    ProductDiffAdapterDetectionInput,
    ProductDiffCleanupReplayRevisionInput,
    ProductDiffCleanupRevisionInput,
    ProductDiffCollectReplayBrowserAssetsInput,
    ProductDiffHealthCheck,
    ProductDiffPreparedReplayRevision,
    ProductDiffPreparedRevision,
    ProductDiffPrepareReplayRevisionInput,
    ProductDiffPrepareRevisionInput,
    ProductDiffReplayBrowserAsset,
    ProductDiffRunningPreview,
    ProductDiffRunningReplay,
    ProductDiffStartReplayRevisionInput,
    ProductDiffStartRevisionInput,
    ProductDiffVerifyRevisionInput,
    ProductDiffWorkspaceCollection,
    ProductDiffWorkspacePlan,
    ProductDiffWorkspaceResolution,
    ProductDiffWorkspaceResolutionInput,
} from "../../adapter.contract";
import type { ProductDiffAdapterRuntime } from "../../adapter.registry";
import ProductDiffPreviewLifecycle, {
    type ProductDiffPreviewLifecycleRevision,
} from "../../service.preview_lifecycle";
import NextPreviewLauncher from "./service.next_preview_launcher";
import NextPreviewSurface from "./service.next_preview_surface";
import { collect_next_replay_assets } from "./service.next_replay_assets";
import { resolve_next_workspace, resolve_next_workspaces } from "./service.next_workspace_resolver";

interface NextReplayLifecycleRevision {
    preparedRevision: ProductDiffPreparedReplayRevision;
    applicationRoot: string;
    workspacePlan: ProductDiffWorkspacePlan;
    surface: PreviewSurface;
    server: PreviewServerHandle | null;
    serverStopped: boolean;
    surfaceRemoved: boolean;
}

function detection_diagnostic(inspection: NextWorkspaceInspection): ProductDiffDiagnostic {
    return {
        code: "NEXT_APPLICATION_NOT_FOUND",
        stage: "adapter-detection",
        message: "No supported Next.js application was found.",
        adapter: "next",
        applicationPath: null,
        workspaceKind: inspection.workspaceKind,
    };
}

function normalized_application_path(applicationPath: string | null): string | null {
    if (!applicationPath) return null;
    const normalized = applicationPath.replaceAll("\\", "/").replace(/^\.\//, "");
    return normalized === "" ? "." : normalized;
}

function selected_detection_paths(plan: {
    applicationPath: string;
    workspaceKind: string;
}): string[] {
    const file = plan.workspaceKind === "Nx" ? "project.json" : "package.json";
    return [plan.applicationPath === "." ? file : `${plan.applicationPath}/${file}`];
}

function selection_mismatch_diagnostic(plan: ProductDiffWorkspacePlan): ProductDiffDiagnostic {
    return {
        code: "NEXT_APPLICATION_SELECTION_MISMATCH",
        stage: "workspace-resolution",
        message: "The selected Next.js application could not be prepared consistently.",
        adapter: "next",
        applicationPath: plan.applicationPath,
        workspaceKind: plan.workspaceKind,
    };
}

function replay_revision_key(revision: string, workspaceRoot: string): string {
    return `${revision}:${posix.resolve(workspaceRoot)}`;
}

function replay_application_root(workspaceRoot: string, applicationPath: string): string {
    if (!posix.isAbsolute(workspaceRoot)) {
        throw new Error("Next replay workspace root must be absolute");
    }
    if (posix.isAbsolute(applicationPath)) {
        throw new Error("Next replay application path must be relative");
    }

    const normalizedWorkspaceRoot = posix.resolve(workspaceRoot);
    const applicationRoot = posix.resolve(normalizedWorkspaceRoot, applicationPath);
    const relativePath = posix.relative(normalizedWorkspaceRoot, applicationRoot);
    if (relativePath === ".." || relativePath.startsWith("../")) {
        throw new Error("Next replay application must be inside the workspace root");
    }
    return applicationRoot;
}

function replay_application_path(workspaceRoot: string, applicationRoot: string): string {
    return posix.relative(workspaceRoot, applicationRoot) || ".";
}

function prepared_revision_matches(
    replay: NextReplayLifecycleRevision,
    preparedRevision: ProductDiffPreparedReplayRevision,
): boolean {
    return (
        replay.preparedRevision.revision === preparedRevision.revision &&
        replay.preparedRevision.workspaceRoot === preparedRevision.workspaceRoot &&
        replay.preparedRevision.applicationPath === preparedRevision.applicationPath &&
        replay.preparedRevision.surfacePath === preparedRevision.surfacePath
    );
}

export default class NextProductDiffAdapter implements ProductDiffAdapter {
    readonly id = "next";
    private readonly inspections = new Map<string, NextWorkspaceInspection>();
    private readonly previews = new Map<string, ProductDiffPreviewLifecycleRevision>();
    private readonly preparedReplays = new Map<string, NextReplayLifecycleRevision>();
    private readonly replayPreviews = new Map<string, NextReplayLifecycleRevision>();
    private readonly runtime: ProductDiffAdapterRuntime;

    constructor(runtime: ProductDiffAdapterRuntime) {
        this.runtime = runtime;
    }

    async detect(input: ProductDiffAdapterDetectionInput): Promise<ProductDiffAdapterDetection> {
        const inspection = await PreviewRunner.inspect_next_workspace(
            this.runtime.sandbox,
            input.workspaceRoot,
            input.changedPaths,
        );
        this.inspections.set(input.workspaceRoot, inspection);
        const supported = inspection.applications.length > 0;
        return {
            supported,
            diagnostics: supported ? [] : [detection_diagnostic(inspection)],
        };
    }

    async resolve_workspace(
        input: ProductDiffWorkspaceResolutionInput,
    ): Promise<ProductDiffWorkspaceResolution> {
        const inspection =
            this.inspections.get(input.workspaceRoot) ??
            (await PreviewRunner.inspect_next_workspace(
                this.runtime.sandbox,
                input.workspaceRoot,
                input.changedPaths,
            ));
        const resolved = resolve_next_workspace(
            inspection,
            input.changedPaths,
            input.configuration ?? null,
        );
        if ("code" in resolved) return { plan: null, diagnostics: [resolved] };

        return this.enrich_workspace_plan(input.workspaceRoot, resolved);
    }

    async resolve_replay_workspaces(
        input: ProductDiffWorkspaceResolutionInput,
    ): Promise<ProductDiffWorkspaceCollection> {
        const inspection =
            this.inspections.get(input.workspaceRoot) ??
            (await PreviewRunner.inspect_next_workspace(
                this.runtime.sandbox,
                input.workspaceRoot,
                input.changedPaths,
            ));
        const resolved = resolve_next_workspaces(
            inspection,
            input.changedPaths,
            input.configuration ?? null,
        );
        const plans: ProductDiffWorkspacePlan[] = [];
        const diagnostics = [...resolved.diagnostics];
        for (const plan of resolved.plans) {
            const enriched = await this.enrich_workspace_plan(input.workspaceRoot, plan);
            if (enriched.plan) plans.push(enriched.plan);
            else diagnostics.push(...enriched.diagnostics);
        }
        return { plans, diagnostics };
    }

    private async enrich_workspace_plan(
        workspaceRoot: string,
        resolved: ProductDiffWorkspacePlan,
    ): Promise<ProductDiffWorkspaceResolution> {
        const detect = await PreviewRunner.detect(
            this.runtime.sandbox,
            workspaceRoot,
            selected_detection_paths(resolved),
        );
        if (
            !detect.supported ||
            !detect.packageManager ||
            !detect.lockfileRelPath ||
            !detect.lockfileSha256
        ) {
            return {
                plan: null,
                diagnostics: [
                    {
                        code: "NEXT_PREVIEW_CONFIGURATION_REQUIRED",
                        stage: "workspace-resolution",
                        message: "The selected Next.js application needs preview configuration.",
                        adapter: this.id,
                        applicationPath: resolved.applicationPath,
                        workspaceKind: resolved.workspaceKind,
                    },
                ],
            };
        }
        if (normalized_application_path(detect.nextAppDir) !== resolved.applicationPath) {
            return { plan: null, diagnostics: [selection_mismatch_diagnostic(resolved)] };
        }

        return {
            plan: {
                ...resolved,
                framework: detect.framework ?? resolved.framework,
                dependency: {
                    packageManager: detect.packageManager,
                    lockfileRelPath: detect.lockfileRelPath,
                    lockfileSha256: detect.lockfileSha256,
                    workspaceDirs: detect.workspaceDirs,
                },
            },
            diagnostics: [],
        };
    }

    async prepare_revision(
        input: ProductDiffPrepareRevisionInput,
    ): Promise<ProductDiffPreparedRevision> {
        const detect = await PreviewRunner.detect(
            this.runtime.sandbox,
            input.workspaceRoot,
            selected_detection_paths(input.plan),
        );
        if (
            !detect.supported ||
            normalized_application_path(detect.nextAppDir) !== input.plan.applicationPath
        ) {
            throw new Error("Next preview preparation requires a supported application");
        }

        await PreviewWorkspace.write_placeholder_env(
            this.runtime.sandbox,
            input.workspaceRoot,
            input.plan.applicationPath,
            detect,
            this.runtime.projectId,
        );
        await PreviewWorkspace.disable_middleware(
            this.runtime.sandbox,
            input.workspaceRoot,
            detect.middlewarePaths,
        );
        if (input.rebuildHarnessRegistry) {
            const scaffold = await PreviewRunner.scaffold(
                this.runtime.sandbox,
                input.workspaceRoot,
                detect,
            );
            if (!scaffold.ok) {
                throw new Error("Next preview scaffold could not be prepared");
            }
            return {
                revision: input.revision,
                workspaceRoot: input.workspaceRoot,
                generatedPaths: scaffold.routeFiles,
            };
        }
        return { revision: input.revision, workspaceRoot: input.workspaceRoot, generatedPaths: [] };
    }

    async start_revision(input: ProductDiffStartRevisionInput): Promise<ProductDiffRunningPreview> {
        const launchPlan = NextPreviewLauncher.from_workspace_plan({
            workspaceRoot: input.workspaceRoot,
            workspacePlan: input.plan,
            port: input.port,
            environment: this.runtime.environment,
        });
        const preview = await ProductDiffPreviewLifecycle.start_and_verify({
            sandbox: this.runtime.sandbox,
            log: this.runtime.log,
            revision: input.revision,
            workspaceRoot: input.workspaceRoot,
            workspacePlan: input.plan,
            launchPlan,
            runId: `run-${input.revision}`,
            rootLayoutMode: input.rootLayoutMode,
        });
        const id = `${input.revision}-${input.port}`;
        this.previews.set(id, preview);
        return {
            id,
            revision: input.revision,
            url: preview.server?.url ?? "",
            surfacePath: preview.surface?.routePath ?? "/unknown",
        };
    }

    async prepare_replay_revision(
        input: ProductDiffPrepareReplayRevisionInput,
    ): Promise<ProductDiffPreparedReplayRevision> {
        const normalizedWorkspaceRoot = posix.resolve(input.workspaceRoot);
        const applicationRoot = replay_application_root(
            normalizedWorkspaceRoot,
            input.plan.applicationPath,
        );
        const workspacePlan = {
            ...input.plan,
            applicationPath: replay_application_path(normalizedWorkspaceRoot, applicationRoot),
        };
        const prepared = await this.prepare_revision({
            ...input,
            workspaceRoot: normalizedWorkspaceRoot,
            plan: workspacePlan,
        });
        const surface = await NextPreviewSurface.create(
            this.runtime.sandbox,
            normalizedWorkspaceRoot,
            workspacePlan,
            `replay-${input.revision}`,
            input.rootLayoutMode,
        );
        const buildPlan = NextPreviewLauncher.build_from_workspace_plan({
            workspaceRoot: normalizedWorkspaceRoot,
            workspacePlan,
            environment: this.runtime.environment,
        });

        try {
            const build = await this.runtime.sandbox.commands.run(buildPlan.command, {
                cwd: buildPlan.workingDirectory,
                envs: buildPlan.environment,
            });
            if (build.exitCode !== 0) throw new Error("Next replay production build failed");
        } catch (error) {
            await NextPreviewSurface.remove(this.runtime.sandbox, surface);
            throw error;
        }

        const preparedRevision: ProductDiffPreparedReplayRevision = {
            ...prepared,
            generatedPaths: [...prepared.generatedPaths, ...surface.generatedFiles],
            applicationPath: applicationRoot,
            surfacePath: surface.routePath,
        };
        this.preparedReplays.set(replay_revision_key(input.revision, normalizedWorkspaceRoot), {
            preparedRevision,
            applicationRoot,
            workspacePlan,
            surface,
            server: null,
            serverStopped: true,
            surfaceRemoved: false,
        });
        return preparedRevision;
    }

    async start_replay_revision(
        input: ProductDiffStartReplayRevisionInput,
    ): Promise<ProductDiffRunningReplay> {
        const replay = this.preparedReplays.get(
            replay_revision_key(input.revision, input.workspaceRoot),
        );
        if (!replay || !prepared_revision_matches(replay, input.preparedRevision)) {
            throw new Error("Next replay startup requires a prepared revision");
        }
        const requestedApplicationRoot = replay_application_root(
            posix.resolve(input.workspaceRoot),
            input.plan.applicationPath,
        );
        if (requestedApplicationRoot !== replay.applicationRoot) {
            throw new Error("Next replay start plan must match the prepared application");
        }

        const launchPlan = NextPreviewLauncher.from_workspace_plan({
            mode: "production",
            workspaceRoot: replay.preparedRevision.workspaceRoot,
            workspacePlan: replay.workspacePlan,
            port: input.port,
            environment: this.runtime.environment,
        });
        const server = await PreviewServer.start(this.runtime.sandbox, launchPlan);
        replay.server = server;
        replay.serverStopped = false;
        const id = `replay-${input.revision}-${input.port}`;
        this.replayPreviews.set(id, replay);

        const ready = await PreviewServer.wait_until_ready(
            this.runtime.sandbox,
            server,
            this.runtime.log,
            `${replay.surface.routePath}/__ready__`,
        );
        if (!ready) {
            await PreviewServer.runtime_diagnostics(
                this.runtime.sandbox,
                server,
                `${replay.surface.routePath}/__ready__`,
            );
            throw new Error("Next replay production server did not become ready");
        }

        return {
            id,
            revision: input.revision,
            url: server.url,
            surfacePath: replay.surface.routePath,
            applicationPath: replay.applicationRoot,
            browserAssets: await collect_next_replay_assets(
                this.runtime.sandbox,
                replay.applicationRoot,
            ),
        };
    }

    async collect_replay_browser_assets(
        input: ProductDiffCollectReplayBrowserAssetsInput,
    ): Promise<ProductDiffReplayBrowserAsset[]> {
        const replay = this.preparedReplays.get(
            replay_revision_key(input.revision, input.workspaceRoot),
        );
        if (!replay || !prepared_revision_matches(replay, input.preparedRevision)) {
            throw new Error("Next replay asset inventory requires a prepared revision");
        }
        return collect_next_replay_assets(this.runtime.sandbox, replay.applicationRoot);
    }

    async verify_revision(input: ProductDiffVerifyRevisionInput): Promise<ProductDiffHealthCheck> {
        const preview = this.previews.get(input.preview.id);
        if (!preview) throw new Error("Next preview verification requires a started revision");
        return {
            revision: input.preview.revision,
            ready: preview.health.ok,
            statusCode: preview.health.ok ? 200 : null,
            diagnostics: preview.health.diagnostic ? [preview.health.diagnostic] : [],
        };
    }

    async cleanup_revision(input: ProductDiffCleanupRevisionInput): Promise<void> {
        if (!input.preview) return;
        const preview = this.previews.get(input.preview.id);
        if (!preview) return;
        await ProductDiffPreviewLifecycle.cleanup_revision(this.runtime.sandbox, preview);
        this.previews.delete(input.preview.id);
    }

    async cleanup_replay_revision(input: ProductDiffCleanupReplayRevisionInput): Promise<void> {
        const key = replay_revision_key(input.revision, input.workspaceRoot);
        const replay = input.preview
            ? this.replayPreviews.get(input.preview.id)
            : this.preparedReplays.get(key);
        if (!replay) return;

        let cleanupError: unknown = null;
        if (!replay.serverStopped) {
            try {
                if (replay.server) await PreviewServer.stop(this.runtime.sandbox, replay.server);
                replay.serverStopped = true;
            } catch (error) {
                cleanupError = error;
            }
        }
        if (!replay.surfaceRemoved) {
            try {
                await NextPreviewSurface.remove(this.runtime.sandbox, replay.surface);
                replay.surfaceRemoved = true;
            } catch (error) {
                cleanupError ??= error;
            }
        }
        if (cleanupError) throw cleanupError;

        if (replay.serverStopped && replay.surfaceRemoved) {
            this.preparedReplays.delete(key);
            for (const [id, candidate] of this.replayPreviews) {
                if (candidate === replay) this.replayPreviews.delete(id);
            }
        }
    }
}
