import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { GET_TEAM_MEMBERS } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { TeamMemberDetail } from "@/types/team";

export const TEAM_MEMBERS_QUERY_KEY = ["team-members"] as const;

export function useGetTeamMembers(teamId: string | undefined) {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: [...TEAM_MEMBERS_QUERY_KEY, teamId],
        enabled: Boolean(token) && Boolean(teamId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ members: TeamMemberDetail[] }>>(
                GET_TEAM_MEMBERS(teamId!),
            );
            return res.data.data.members;
        },
    });
}
