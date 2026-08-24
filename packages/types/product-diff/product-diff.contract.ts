import type { ProductDiffStatus } from "../prisma/enums.prisma";

export interface ProductDiffManifestV1 {
    targets: {
        id: string;
        label: string;
        states: { id: string; label: string }[];
    }[];
    warnings: string[];
}

export interface ProductDiffDiagnostic {
    code: string;
    stage: string;
    message: string;
    adapter: string | null;
    applicationPath: string | null;
    workspaceKind: string | null;
}

export interface ProductDiffPreviewConfiguration {
    applicationPath?: string;
    launchCommand?: string;
    healthPath?: string;
    visualRoutes?: string[];
}

export const ProductDiffFramework = {
    NextAppRouter: "NextAppRouter",
    NextPagesRouter: "NextPagesRouter",
} as const;
export type ProductDiffFramework = (typeof ProductDiffFramework)[keyof typeof ProductDiffFramework];

export const ProductDiffShotOutcome = {
    Rendered: "Rendered",
    Added: "Added",
    Removed: "Removed",
    Unavailable: "Unavailable",
} as const;
export type ProductDiffShotOutcome =
    (typeof ProductDiffShotOutcome)[keyof typeof ProductDiffShotOutcome];

export interface ProductDiffViewport {
    id: string;
    label: string;
    width: number;
    height: number;
}

export interface ProductDiffShot {
    stateId: string;
    viewportId: string;
    outcome: ProductDiffShotOutcome;
    baseKey: string | null;
    headKey: string | null;
    diffKey: string | null;
    diffPercentage: number | null;
    error: string | null;
}

export interface ProductDiffTarget {
    id: string;
    label: string;
    sourcePath: string;
    outcome: ProductDiffShotOutcome;
    states: { id: string; label: string }[];
    shots: ProductDiffShot[];
}

export interface ProductDiffManifestV2 {
    version: 2;
    framework: ProductDiffFramework;
    viewports: ProductDiffViewport[];
    targets: ProductDiffTarget[];
    warnings: string[];
}

export interface ProductReviewShot {
    stateId: string;
    viewportId: string;
    outcome: ProductDiffShotOutcome;
    baseKey: string | null;
    headKey: string | null;
    error: string | null;
}

export interface ProductReviewTarget {
    id: string;
    label: string;
    sourcePath: string;
    outcome: ProductDiffShotOutcome;
    states: { id: string; label: string }[];
    shots: ProductReviewShot[];
}

export interface ProductDiffManifestV3 {
    version: 3;
    framework: ProductDiffFramework;
    viewports: ProductDiffViewport[];
    targets: ProductReviewTarget[];
    warnings: string[];
}

export type ProductDiffManifest =
    ProductDiffManifestV1 | ProductDiffManifestV2 | ProductDiffManifestV3;

export interface ProductDiffSummary {
    id: string;
    issueId: string;
    issueNumber: number;
    issueTitle: string;
    prUrl: string;
    baseSha: string;
    headSha: string;
    status: ProductDiffStatus;
    error: string | null;
}

export interface ProductDiffDetail extends ProductDiffSummary {
    manifest: ProductDiffManifest | null;
    baseUrl: string | null;
    headUrl: string | null;
    diagnostics: ProductDiffDiagnostic | null;
}

/**
 * Tells you whether a stored manifest is the newer screenshot kind or the older HTML kind.
 *
 * Manifests are saved as untyped JSON, so a row written months ago has a different shape
 * from one written today. Check with this before reading anything screenshot-specific.
 *
 * @example
 * if (is_product_diff_manifest_v2(detail.manifest)) {
 *     detail.manifest.targets[0].shots; // safe — only v2 has screenshots
 * }
 */
export function is_product_diff_manifest_v2(
    manifest: ProductDiffManifest | null,
): manifest is ProductDiffManifestV2 {
    return manifest !== null && "version" in manifest && manifest.version === 2;
}

export function is_product_diff_manifest_v3(
    manifest: ProductDiffManifest | null,
): manifest is ProductDiffManifestV3 {
    return manifest !== null && "version" in manifest && manifest.version === 3;
}

export function is_screenshot_product_review_manifest(
    manifest: ProductDiffManifest | null,
): manifest is ProductDiffManifestV2 | ProductDiffManifestV3 {
    return is_product_diff_manifest_v2(manifest) || is_product_diff_manifest_v3(manifest);
}

/**
 * Collects every artifact key a manifest points at, so callers can check a requested key is real.
 *
 * The server uses this to refuse signing anything the manifest does not mention — without it,
 * asking for a URL would sign any object in the bucket, including other projects' screenshots.
 *
 * @example
 * const allowed = product_diff_artifact_keys(manifest);
 * allowed.has("shots/header-nav/default/desktop/head.png"); // true
 */
export function product_diff_artifact_keys(manifest: ProductDiffManifest | null): Set<string> {
    const keys = new Set<string>();
    if (!is_screenshot_product_review_manifest(manifest)) return keys;

    if (is_product_diff_manifest_v2(manifest)) {
        for (const target of manifest.targets) {
            for (const shot of target.shots) {
                for (const key of [shot.baseKey, shot.headKey, shot.diffKey]) {
                    if (key) keys.add(key);
                }
            }
        }
        return keys;
    }

    for (const target of manifest.targets) {
        for (const shot of target.shots) {
            for (const key of [shot.baseKey, shot.headKey]) {
                if (key) keys.add(key);
            }
        }
    }
    return keys;
}
