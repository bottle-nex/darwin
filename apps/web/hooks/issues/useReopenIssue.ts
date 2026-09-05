import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue } from "@trymatcha/types";

import { updateBoardIssue } from "@/hooks/issues/useBoard";
import { apiClient } from "@/lib/axios";
import { REOPEN_ISSUE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { issueAttemptsKey } from "./useIssueAttempts";

export interface ReopenIssueInput {
    id: string;
    project_id: string;
    note: string;
}

export function useReopenIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: ReopenIssueInput) => {
            const res = await apiClient.post<ApiResponse<{ issue: Issue }>>(
                REOPEN_ISSUE_URL(input.id),
                { note: input.note },
            );
            return res.data.data.issue;
        },
        onSuccess: (issue, variables) => {
            updateBoardIssue(queryClient, variables.project_id, issue);
            queryClient.invalidateQueries({ queryKey: issueAttemptsKey(variables.id) });
        },
    });
}
