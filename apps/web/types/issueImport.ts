import type { GithubImportTarget } from "@trymatcha/types";

export type IssueImportConfig = {
    enabled: boolean;
    target: GithubImportTarget | null;
    customColumnId: string | null;
    tagId: string | null;
    backfillAt: string | null;
    importedCount: number;
    lastImportedAt: string | null;
};

export type UpdateIssueImportInput = {
    projectId: string;
    enabled?: boolean;
    target?: GithubImportTarget;
    customColumnId?: string | null;
    tagId?: string | null;
    backfill?: boolean;
};
