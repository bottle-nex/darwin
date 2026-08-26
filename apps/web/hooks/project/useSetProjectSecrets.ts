import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { SET_PROJECT_SECRET } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { PROJECT_SECRETS_QUERY_KEY } from "./useProjectSecrets";

interface SetSecretsInput {
    projectId: string;
    secrets: { key: string; value: string }[];
}

export function useSetProjectSecrets() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, secrets }: SetSecretsInput) => {
            const res = await apiClient.post<ApiResponse<{ count: number }>>(
                SET_PROJECT_SECRET(projectId),
                { secrets },
            );
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_SECRETS_QUERY_KEY });
        },
    });
}
