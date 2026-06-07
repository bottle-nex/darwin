import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { INVITE_MEMBER_URL } from "@/routes/api_routes";
import { ApiResponse } from "@/types/api";

interface InvitePayload {
    emails: string[];
    orgId: string;
    projectId: string;
    teamId: string;
    message?: string;
}

interface InviteResult {
    invited: string[];
    failed: {
        email: string;
        reason: string;
    }[];
}

export default function useInviteTeamMember() {
    return useMutation({
        mutationFn: async (payload: InvitePayload) => {
            const res = await apiClient.post<ApiResponse<InviteResult>>(INVITE_MEMBER_URL, payload);
            return res.data.data;
        },
    });
}
