import { useProductDiffs } from "./useProductDiffs";

/**
 * The Product Diff attached to one issue. The list endpoint already carries
 * `issueId` on every summary, so no per-issue request is needed.
 */
export function useIssueProductDiff(projectId: string | undefined, issueId: string) {
    const { data: diffs = [], isPending } = useProductDiffs(projectId);
    return { diff: diffs.find((diff) => diff.issueId === issueId) ?? null, isPending };
}
