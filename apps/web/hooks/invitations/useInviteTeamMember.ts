import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectRole } from "@trymatcha/types";
import { apiClient } from "@/lib/axios";
import { INVITE_MEMBER_URL } from "@/routes/api_routes";
import { ApiResponse } from "@/types/api";
import { TEAM_MEMBERS_QUERY_KEY } from "@/hooks/team/useGetTeamMembers";

interface InvitePayload {
    emails: string[];
    userIds: string[];
    orgId: string;
    projectId: string;
    teamId: string;
    role: ProjectRole;
    message?: string;
}

interface InviteResult {
    added: string[];
    invited: string[];
    failed: {
        email?: string;
        userId?: string;
        reason: string;
    }[];
}

export default function useInviteTeamMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: InvitePayload) => {
            const res = await apiClient.post<ApiResponse<InviteResult>>(INVITE_MEMBER_URL, payload);
            return res.data.data;
        },
        onSuccess: (_data, payload) => {
            queryClient.invalidateQueries({
                queryKey: [...TEAM_MEMBERS_QUERY_KEY, payload.teamId],
            });
        },
    });
}
