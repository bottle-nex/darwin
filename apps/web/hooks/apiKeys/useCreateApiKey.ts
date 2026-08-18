import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { API_KEYS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { CreatedApiKey } from "@/types/apiKey.type";
import { API_KEYS_QUERY_KEY } from "./useApiKeys";

export function useCreateApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (label: string) => {
            const res = await apiClient.post<ApiResponse<{ api_key: CreatedApiKey }>>(
                API_KEYS_URL,
                { label },
            );
            return res.data.data.api_key;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
        },
    });
}
