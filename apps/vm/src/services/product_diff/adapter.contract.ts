import type {
    ProductDiffDiagnostic,
    ProductDiffPreviewConfiguration,
    ProductDiffRootLayoutMode,
} from "@trymatcha/types";

export type ProductDiffRevision = "base" | "head";

export interface ProductDiffAdapterDetectionInput {
    workspaceRoot: string;
    changedPaths: string[];
    configuration?: ProductDiffPreviewConfiguration | null;
}

export interface ProductDiffAdapterDetection {
    supported: boolean;
    diagnostics: ProductDiffDiagnostic[];
}

export interface ProductDiffWorkspacePlan {
    repositoryRoot: string;
    applicationPath: string;
    workspaceKind: string;
    installDirectory: string;
    launchCommand: string;
    healthPath: string;
    router: string;
    framework: string;
    rootLayoutMode: ProductDiffRootLayoutMode | null;
    nxTargets?: {
        build: string;
        serve: string;
    };
    dependency: {
        packageManager: "bun" | "pnpm" | "yarn" | "npm";
        lockfileRelPath: string;
        lockfileSha256: string;
        workspaceDirs: string[];
    };
}

export interface ProductDiffWorkspaceResolutionInput extends ProductDiffAdapterDetectionInput {
    detection: ProductDiffAdapterDetection;
}

export interface ProductDiffWorkspaceResolution {
    plan: ProductDiffWorkspacePlan | null;
    diagnostics: ProductDiffDiagnostic[];
}

export interface ProductDiffWorkspaceCollection {
    plans: ProductDiffWorkspacePlan[];
    diagnostics: ProductDiffDiagnostic[];
}

export interface ProductDiffPrepareRevisionInput {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    plan: ProductDiffWorkspacePlan;
    rebuildHarnessRegistry?: boolean;
}

export interface ProductDiffPreparedRevision {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    generatedPaths: string[];
}

export interface ProductDiffPrepareReplayRevisionInput extends ProductDiffPrepareRevisionInput {
    rootLayoutMode: ProductDiffRootLayoutMode;
}

export interface ProductDiffPreparedReplayRevision extends ProductDiffPreparedRevision {
    applicationPath: string;
    surfacePath: string;
}

export interface ProductDiffStartRevisionInput {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    plan: ProductDiffWorkspacePlan;
    preparedRevision: ProductDiffPreparedRevision;
    port: number;
    rootLayoutMode: ProductDiffRootLayoutMode;
}

export interface ProductDiffRunningPreview {
    id: string;
    revision: ProductDiffRevision;
    url: string;
    surfacePath: string;
}

export interface ProductDiffReplayBrowserAsset {
    requestPath: string;
    sourcePath: string;
    contentType: string;
}

export interface ProductDiffStartReplayRevisionInput {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    plan: ProductDiffWorkspacePlan;
    preparedRevision: ProductDiffPreparedReplayRevision;
    port: number;
}

export interface ProductDiffRunningReplay extends ProductDiffRunningPreview {
    applicationPath: string;
    browserAssets: ProductDiffReplayBrowserAsset[];
}

export interface ProductDiffCollectReplayBrowserAssetsInput {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    preparedRevision: ProductDiffPreparedReplayRevision;
}

export interface ProductDiffVerifyRevisionInput {
    preview: ProductDiffRunningPreview;
    plan: ProductDiffWorkspacePlan;
}

export interface ProductDiffHealthCheck {
    revision: ProductDiffRevision;
    ready: boolean;
    statusCode: number | null;
    diagnostics: ProductDiffDiagnostic[];
}

export interface ProductDiffCleanupRevisionInput {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    preparedRevision: ProductDiffPreparedRevision | null;
    preview: ProductDiffRunningPreview | null;
}

export interface ProductDiffCleanupReplayRevisionInput {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    preparedRevision: ProductDiffPreparedReplayRevision | null;
    preview: ProductDiffRunningReplay | null;
}

export interface ProductDiffAdapter {
    id: string;
    detect(_input: ProductDiffAdapterDetectionInput): Promise<ProductDiffAdapterDetection>;
    resolve_workspace(
        _input: ProductDiffWorkspaceResolutionInput,
    ): Promise<ProductDiffWorkspaceResolution>;
    resolve_replay_workspaces?(
        _input: ProductDiffWorkspaceResolutionInput,
    ): Promise<ProductDiffWorkspaceCollection>;
    prepare_revision(_input: ProductDiffPrepareRevisionInput): Promise<ProductDiffPreparedRevision>;
    start_revision(_input: ProductDiffStartRevisionInput): Promise<ProductDiffRunningPreview>;
    prepare_replay_revision(
        _input: ProductDiffPrepareReplayRevisionInput,
    ): Promise<ProductDiffPreparedReplayRevision>;
    start_replay_revision(
        _input: ProductDiffStartReplayRevisionInput,
    ): Promise<ProductDiffRunningReplay>;
    collect_replay_browser_assets(
        _input: ProductDiffCollectReplayBrowserAssetsInput,
    ): Promise<ProductDiffReplayBrowserAsset[]>;
    verify_revision(_input: ProductDiffVerifyRevisionInput): Promise<ProductDiffHealthCheck>;
    cleanup_revision(_input: ProductDiffCleanupRevisionInput): Promise<void>;
    cleanup_replay_revision(_input: ProductDiffCleanupReplayRevisionInput): Promise<void>;
}
