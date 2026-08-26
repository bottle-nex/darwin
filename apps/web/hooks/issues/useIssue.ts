"use client";

import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { ISSUE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardIssue } from "@/types/board";

import { issueKey } from "./boardCache";

export function issueQueryOptions(projectId: string, issueId: string) {
    return queryOptions({
        queryKey: issueKey(projectId, issueId),
        queryFn: async ({ signal }) => {
            const response = await apiClient.get<ApiResponse<{ issue: BoardIssue }>>(
                ISSUE_URL(issueId),
                { params: { project_id: projectId }, signal },
            );
            return response.data.data.issue;
        },
    });
}

export function useIssue(projectId: string | undefined, issueId: string | undefined) {
    return useQuery({
        ...issueQueryOptions(projectId ?? "", issueId ?? ""),
        enabled: Boolean(projectId && issueId),
    });
}

export function useIssues(projectId: string | undefined, issueIds: string[]) {
    return useQueries({
        queries: issueIds.map((issueId) => ({
            ...issueQueryOptions(projectId ?? "", issueId),
            enabled: Boolean(projectId),
        })),
        combine: (results) => ({
            issues: results.flatMap((result) => (result.data ? [result.data] : [])),
            isPending: results.some((result) => result.isPending),
            isError: results.some((result) => result.isError),
            isComplete:
                issueIds.length > 0 && results.every((result) => result.isSuccess && result.data),
            retry: () =>
                Promise.all(
                    results.filter((result) => result.isError).map((result) => result.refetch()),
                ),
        }),
    });
}
