import { useQuery, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ISSUE_ACTIVITY_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { AgentSession, IssueActivity } from "@trymatcha/types";

export const ACTIVITY_QUERY_KEY = ["activity"] as const;

/** The most recent page of an issue's timeline, oldest first. */
export function useActivity(issueId: string | undefined) {
    return useQuery({
        queryKey: [...ACTIVITY_QUERY_KEY, issueId],
        enabled: Boolean(issueId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ activities: IssueActivity[] }>>(
                ISSUE_ACTIVITY_URL(issueId!),
            );
            return res.data.data.activities;
        },
    });
}

/**
 * Appends a broadcast batch, skipping rows already held — the emitter's own
 * PATCH response can race the socket message it triggered.
 */
export function append_activities(
    queryClient: QueryClient,
    issueId: string,
    activities: IssueActivity[],
) {
    queryClient.setQueryData<IssueActivity[]>([...ACTIVITY_QUERY_KEY, issueId], (prev) => {
        if (!prev) return prev;
        const held = new Set(prev.map((row) => row.id));
        const incoming = activities.filter((row) => !held.has(row.id));
        if (!incoming.length) return prev;
        return [...prev, ...incoming].sort((a, b) => Number(BigInt(a.seq) - BigInt(b.seq)));
    });
}

/**
 * A session mutates for the whole time it runs, so its card reads through the
 * `RunStarted` row it hangs off rather than off a row of its own.
 */
export function update_agent_session(queryClient: QueryClient, session: AgentSession) {
    queryClient.setQueryData<IssueActivity[]>([...ACTIVITY_QUERY_KEY, session.issueId], (prev) =>
        prev?.map((row) => (row.sessionId === session.id ? { ...row, session } : row)),
    );
}
