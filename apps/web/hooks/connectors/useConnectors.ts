import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { CONNECTORS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { ConnectorStatus } from "@/types/connector.type";

export const CONNECTORS_QUERY_KEY = ["connectors"];

export function useConnectors() {
    return useQuery({
        queryKey: CONNECTORS_QUERY_KEY,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ConnectorStatus[]>>(CONNECTORS_URL);
            return res.data.data;
        },
    });
}
