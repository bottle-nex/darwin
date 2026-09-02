"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { ISSUE_ATTEMPTS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { IssueAttempts } from "@/types/issueAttempt.type";

export const ISSUE_ATTEMPTS_QUERY_KEY = ["issue-attempts"] as const;

export function issueAttemptsKey(issueId: string) {
    return [...ISSUE_ATTEMPTS_QUERY_KEY, issueId] as const;
}

export function useIssueAttempts(issueId: string | undefined) {
    return useQuery({
        queryKey: issueAttemptsKey(issueId ?? ""),
        enabled: Boolean(issueId),
        queryFn: async ({ signal }) => {
            const response = await apiClient.get<ApiResponse<IssueAttempts>>(
                ISSUE_ATTEMPTS_URL(issueId!),
                { signal },
            );
            return response.data.data;
        },
    });
}
