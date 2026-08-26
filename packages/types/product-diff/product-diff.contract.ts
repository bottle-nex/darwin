import type { ProductDiffStatus } from "../prisma/enums.prisma";
import type { CapsuleManifest } from "./capsule.contract";

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
    manifest: CapsuleManifest | null;
}
