import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TeamRole } from "@trymatcha/types";

import { TEAM_MEMBERS_QUERY_KEY } from "@/hooks/team/useGetTeamMembers";
import { apiClient } from "@/lib/axios";
import { CHANGE_MEMBER_AUTHORITY } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export function useChangeMemberAuthority(teamId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ memberId, role }: { memberId: string; role: TeamRole }) => {
            const res = await apiClient.post<ApiResponse<null>>(CHANGE_MEMBER_AUTHORITY, {
                teamId,
                memberId,
                role,
            });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...TEAM_MEMBERS_QUERY_KEY, teamId] });
        },
    });
}
