import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { GITHUB_CONNECT_COMPLETE } from "@/routes/api_routes";
import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";
import type { ApiResponse } from "@/types/api";

export interface CompleteGithubConnectInput {
    installationId: string;
    code: string;
    state: string;
}

interface CompleteResult {
    orgId: string;
    orgSlug: string | null;
    accountLogin: string;
}

/** Finish the install round-trip: hand the callback params to the server. */
export function useCompleteGithubConnect() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CompleteGithubConnectInput) => {
            const res = await apiClient.post<ApiResponse<CompleteResult>>(
                GITHUB_CONNECT_COMPLETE,
                input,
            );
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
        },
    });
}
