import type { ProductDiffStatus } from "../prisma/enums.prisma";

export interface ProductDiffManifest {
    targets: {
        id: string;
        label: string;
        states: { id: string; label: string }[];
    }[];
    warnings: string[];
}

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
}
