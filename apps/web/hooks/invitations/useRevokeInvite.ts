import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TEAM_MEMBERS_QUERY_KEY } from "@/hooks/team/useGetTeamMembers";
import { apiClient } from "@/lib/axios";
import { REVOKE_INVITE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export default function useRevokeInvite(teamId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (invitationId: string) => {
            const res = await apiClient.post<ApiResponse<null>>(REVOKE_INVITE_URL, {
                invitationId,
            });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...TEAM_MEMBERS_QUERY_KEY, teamId] });
        },
    });
}
