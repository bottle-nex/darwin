import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TEAM_MEMBERS_QUERY_KEY } from "@/hooks/team/useGetTeamMembers";
import { apiClient } from "@/lib/axios";
import { REMOVE_MEMBERS } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

/** Omitting `teamId` removes them from every team in the org, and from the org itself. */
export function useRemoveMembers(orgId: string | undefined, teamId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userIds, scope }: { userIds: string[]; scope: "team" | "org" }) => {
            if (!orgId) throw new Error("missing org");
            const res = await apiClient.post<ApiResponse<{ removed: string[] }>>(REMOVE_MEMBERS, {
                orgId,
                userIds,
                ...(scope === "team" && { teamId }),
            });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...TEAM_MEMBERS_QUERY_KEY, teamId] });
        },
    });
}
