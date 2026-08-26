import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import SessionServices from "@/lib/session";
import { LAST_VISITED_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { LastVisited } from "@/types/user";

export const LAST_VISITED_QUERY_KEY = ["user", "last-visited"] as const;

export function useLastVisited() {
    const token = SessionServices.get_token();

    return useQuery({
        queryKey: LAST_VISITED_QUERY_KEY,
        enabled: Boolean(token),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<LastVisited | null>>(LAST_VISITED_URL);
            return res.data.data;
        },
    });
}
