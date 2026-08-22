import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { BULK_DELETE_ISSUES_URL } from "@/routes/api_routes";
import { removeBoardIssueCaches } from "@/hooks/issues/boardCache";
import type { ApiResponse } from "@/types/api";
import type { BoardIssue, BoardLane } from "@/types/board";

type BulkDeleteResult = {
    deleted: string[];
    failed: string[];
    changes: { issue: BoardIssue; beforeLane: BoardLane }[];
};

export interface BulkDeleteIssuesInput {
    issue_ids: string[];
    /** Used only to target the right board cache entry; not sent in the body. */
    project_id: string;
}

export function useBulkDeleteIssues() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: BulkDeleteIssuesInput) => {
            const res = await apiClient.post<ApiResponse<BulkDeleteResult>>(
                BULK_DELETE_ISSUES_URL,
                { issue_ids: input.issue_ids },
            );
            return res.data.data;
        },
        onSuccess: (data, variables) => {
            for (const change of data.changes) {
                removeBoardIssueCaches(
                    queryClient,
                    variables.project_id,
                    change.issue.id,
                    change.beforeLane,
                );
            }
        },
    });
}
