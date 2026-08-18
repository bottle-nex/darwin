import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { REVOKE_API_KEY_URL } from "@/routes/api_routes";
import { API_KEYS_QUERY_KEY } from "./useApiKeys";

export function useRevokeApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(REVOKE_API_KEY_URL(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
        },
    });
}
