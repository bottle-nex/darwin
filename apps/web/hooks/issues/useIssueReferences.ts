import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ISSUE_REFERENCES_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { SelectedThread } from "@/store/playground/usePlaygroundNavStore";

export interface IssueReference {
    id: string;
    createdAt: string;
    messageId: string;
    message: string;
    sender: { id: string; name: string | null; email: string; image: string | null } | null;
    thread: SelectedThread;
}

export const ISSUE_REFERENCES_QUERY_KEY = ["issue-references"] as const;

/** Every chat message that #-tags this issue, newest first. */
export function useIssueReferences(issueId: string | undefined) {
    return useQuery({
        queryKey: [...ISSUE_REFERENCES_QUERY_KEY, issueId],
        enabled: Boolean(issueId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ references: IssueReference[] }>>(
                ISSUE_REFERENCES_URL(issueId!),
            );
            return res.data.data.references;
        },
    });
}
