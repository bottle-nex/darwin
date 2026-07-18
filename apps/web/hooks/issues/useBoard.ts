import { useQuery, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { BOARD_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardIssue, BoardResponse } from "@/types/board";
import type { Issue } from "@trymatcha/types";

export const BOARD_QUERY_KEY = ["board"] as const;

/** Hydrate the kanban for a project: all custom columns + all issues with assignees. */
export function useBoard(projectId: string | undefined) {
    return useQuery({
        queryKey: [...BOARD_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BoardResponse>>(BOARD_URL(projectId!));
            return res.data.data;
        },
    });
}

/** Maps the server's full `Issue` (create response / socket broadcast) onto the board's row shape. */
function toBoardIssue(issue: Issue): BoardIssue {
    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        summary: issue.summary,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        customColumnId: issue.customColumnId,
        createdAt: new Date(issue.createdAt).toISOString(),
        startDate: issue.startDate ? new Date(issue.startDate).toISOString() : null,
        targetDate: issue.targetDate ? new Date(issue.targetDate).toISOString() : null,
        assignees: issue.assignees,
        tags: issue.tags,
    };
}

/**
 * Insert a freshly created issue straight into the cached board, idempotently
 * (by id). Used both by the create mutation's own response and by the
 * ISSUE_CREATED broadcast other clients receive, so nobody has to refetch the
 * board to see it. No-ops if the board isn't loaded yet.
 */
export function upsertBoardIssue(queryClient: QueryClient, projectId: string, issue: Issue) {
    queryClient.setQueryData<BoardResponse>([...BOARD_QUERY_KEY, projectId], (prev) => {
        if (!prev) return prev;
        if (prev.issues.some((existing) => existing.id === issue.id)) return prev;
        return { ...prev, issues: [...prev.issues, toBoardIssue(issue)] };
    });
}
