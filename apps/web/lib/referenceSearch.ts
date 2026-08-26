import type { QueryClient } from "@tanstack/react-query";
import type { IssueStatus } from "@trymatcha/types";

import { PROJECT_MEMBERS_QUERY_KEY, type ProjectMember } from "@/hooks/project/useProjectMembers";
import { apiClient } from "@/lib/axios";
import { LIST_PROJECT_MEMBERS_URL, SEARCH_ISSUES_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export type IssueSuggestion = {
    id: string;
    number: number;
    title: string;
    status: IssueStatus;
    priority: number;
};

export const ISSUE_SEARCH_QUERY_KEY = ["issue-search"] as const;

const SUGGESTION_STALE_TIME = 30_000;

export function search_members(
    queryClient: QueryClient,
    projectId: string,
    query: string,
): Promise<ProjectMember[]> {
    return queryClient.fetchQuery({
        queryKey: [...PROJECT_MEMBERS_QUERY_KEY, projectId, query],
        staleTime: SUGGESTION_STALE_TIME,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ members: ProjectMember[] }>>(
                LIST_PROJECT_MEMBERS_URL(projectId, query),
            );
            return res.data.data.members;
        },
    });
}

export function search_issues(
    queryClient: QueryClient,
    projectId: string,
    query: string,
): Promise<IssueSuggestion[]> {
    return queryClient.fetchQuery({
        queryKey: [...ISSUE_SEARCH_QUERY_KEY, projectId, query],
        staleTime: SUGGESTION_STALE_TIME,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ issues: IssueSuggestion[] }>>(
                SEARCH_ISSUES_URL(projectId, query),
            );
            return res.data.data.issues;
        },
    });
}
