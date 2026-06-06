import { apiClient } from "@/lib/axios";
import { ACCEPT_INVITE_URL } from "@/routes/api_routes";
import { ApiResponse } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ORGANIZATIONS_QUERY_KEY } from "../playground/useFetchOrganizations";

interface AcceptResult {
    orgId: string;
    teamId: string | null;
}

export default function useAcceptInvite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (token: string) => {
            const res = await apiClient.post<ApiResponse<AcceptResult>>(ACCEPT_INVITE_URL, { token });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
            queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
        }

    })
}