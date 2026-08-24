import type { ProductDiffDiagnostic, ProductDiffPreviewConfiguration } from "@trymatcha/types";

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
}

export interface ProductDiffWorkspaceResolutionInput extends ProductDiffAdapterDetectionInput {
    detection: ProductDiffAdapterDetection;
}

export interface ProductDiffWorkspaceResolution {
    plan: ProductDiffWorkspacePlan | null;
    diagnostics: ProductDiffDiagnostic[];
}

export interface ProductDiffPrepareRevisionInput {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    plan: ProductDiffWorkspacePlan;
}

export interface ProductDiffPreparedRevision {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    generatedPaths: string[];
}

export interface ProductDiffStartRevisionInput {
    revision: ProductDiffRevision;
    workspaceRoot: string;
    plan: ProductDiffWorkspacePlan;
    preparedRevision: ProductDiffPreparedRevision;
    port: number;
}

export interface ProductDiffRunningPreview {
    id: string;
    revision: ProductDiffRevision;
    url: string;
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

export interface ProductDiffAdapter {
    id: string;
    detect(input: ProductDiffAdapterDetectionInput): Promise<ProductDiffAdapterDetection>;
    resolve_workspace(
        input: ProductDiffWorkspaceResolutionInput,
    ): Promise<ProductDiffWorkspaceResolution>;
    prepare_revision(input: ProductDiffPrepareRevisionInput): Promise<ProductDiffPreparedRevision>;
    start_revision(input: ProductDiffStartRevisionInput): Promise<ProductDiffRunningPreview>;
    verify_revision(input: ProductDiffVerifyRevisionInput): Promise<ProductDiffHealthCheck>;
    cleanup_revision(input: ProductDiffCleanupRevisionInput): Promise<void>;
}
