import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";
import { apiClient } from "@/lib/axios";
import { GITHUB_DISCONNECT } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

/** Disconnect an org's GitHub installation (darwin-side link only). */
export function useDisconnectGithub() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (orgId: string) => {
            const res = await apiClient.delete<ApiResponse<{ manageUrl: string }>>(
                GITHUB_DISCONNECT(orgId),
            );
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
        },
    });
}
