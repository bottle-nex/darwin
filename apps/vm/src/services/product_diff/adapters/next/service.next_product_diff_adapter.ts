import type { ProductDiffDiagnostic } from "@trymatcha/types";

import PreviewRunner, { type NextWorkspaceInspection } from "../../../service.preview_runner";
import PreviewWorkspace from "../../../service.preview_workspace";
import type {
    ProductDiffAdapter,
    ProductDiffAdapterDetection,
    ProductDiffAdapterDetectionInput,
    ProductDiffCleanupRevisionInput,
    ProductDiffHealthCheck,
    ProductDiffPreparedRevision,
    ProductDiffPrepareRevisionInput,
    ProductDiffRunningPreview,
    ProductDiffStartRevisionInput,
    ProductDiffVerifyRevisionInput,
    ProductDiffWorkspacePlan,
    ProductDiffWorkspaceResolution,
    ProductDiffWorkspaceResolutionInput,
} from "../../adapter.contract";
import type { ProductDiffAdapterRuntime } from "../../adapter.registry";
import ProductDiffPreviewLifecycle, {
    type ProductDiffPreviewLifecycleRevision,
} from "../../service.preview_lifecycle";
import NextPreviewLauncher from "./service.next_preview_launcher";
import { resolve_next_workspace } from "./service.next_workspace_resolver";

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

function selected_detection_paths(applicationPath: string): string[] {
    return [applicationPath === "." ? "package.json" : `${applicationPath}/package.json`];
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

export default class NextProductDiffAdapter implements ProductDiffAdapter {
    readonly id = "next";
    private readonly inspections = new Map<string, NextWorkspaceInspection>();
    private readonly previews = new Map<string, ProductDiffPreviewLifecycleRevision>();

    constructor(private readonly runtime: ProductDiffAdapterRuntime) {}

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

        const detect = await PreviewRunner.detect(
            this.runtime.sandbox,
            input.workspaceRoot,
            selected_detection_paths(resolved.applicationPath),
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
            selected_detection_paths(input.plan.applicationPath),
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
}
