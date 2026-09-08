import { type QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { AgentSession, IssueActivity } from "@trydarwin/types";

import { apiClient } from "@/lib/axios";
import { ISSUE_ACTIVITY_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import {
    type ActivityInfiniteData,
    type ActivityPage,
    activityPageParams,
    appendActivitiesToNewestPage,
    updateAgentSessionInPages,
} from "./activityCache";

export const ACTIVITY_QUERY_KEY = ["activity"] as const;

export function useActivity(issueId: string | undefined) {
    return useInfiniteQuery({
        queryKey: [...ACTIVITY_QUERY_KEY, issueId],
        enabled: Boolean(issueId),
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam, signal }) => {
            const res = await apiClient.get<ApiResponse<ActivityPage>>(
                ISSUE_ACTIVITY_URL(issueId!),
                { params: activityPageParams(pageParam), signal },
            );
            return res.data.data;
        },
        getNextPageParam: (page) => (page.hasMore ? page.nextCursor : undefined),
    });
}

export function append_activities(
    queryClient: QueryClient,
    issueId: string,
    activities: IssueActivity[],
) {
    const queryKey = [...ACTIVITY_QUERY_KEY, issueId] as const;
    if (!queryClient.getQueryData(queryKey)) {
        queryClient.invalidateQueries({ queryKey, exact: true });
        return;
    }
    queryClient.setQueryData<ActivityInfiniteData>(queryKey, (previous) =>
        previous ? appendActivitiesToNewestPage(previous, activities) : previous,
    );
}

export function update_agent_session(queryClient: QueryClient, session: AgentSession) {
    const queryKey = [...ACTIVITY_QUERY_KEY, session.issueId] as const;
    if (!queryClient.getQueryData(queryKey)) {
        queryClient.invalidateQueries({ queryKey, exact: true });
        return;
    }
    queryClient.setQueryData<ActivityInfiniteData>(queryKey, (previous) =>
        previous ? updateAgentSessionInPages(previous, session) : previous,
    );
}
