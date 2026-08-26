import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import SessionServices from "@/lib/session";
import { API_KEYS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { ApiKey } from "@/types/apiKey.type";

export const API_KEYS_QUERY_KEY = ["claude-mcp", "api-keys"] as const;

export function useApiKeys() {
    const token = SessionServices.get_token();

    return useQuery({
        queryKey: API_KEYS_QUERY_KEY,
        enabled: Boolean(token),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ api_keys: ApiKey[] }>>(API_KEYS_URL);
            return res.data.data.api_keys;
        },
    });
}
