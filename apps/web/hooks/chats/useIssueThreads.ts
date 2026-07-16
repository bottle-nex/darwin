import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ISSUE_THREADS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { IssueThreadSummary } from "@/types/thread";

export const ISSUE_THREADS_QUERY_KEY = ["issue-threads"] as const;

/** Lists every issue with at least one comment, most recent activity first. */
export function useIssueThreads(projectId: string | undefined) {
    return useQuery({
        queryKey: [...ISSUE_THREADS_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ threads: IssueThreadSummary[] }>>(
                ISSUE_THREADS_URL(projectId!),
            );
            return res.data.data.threads;
        },
    });
}
