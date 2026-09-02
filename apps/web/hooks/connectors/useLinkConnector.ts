import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { CONNECTOR_LINK_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { ConnectorProvider } from "@/types/connector.type";

export function useLinkConnector() {
    return useMutation({
        mutationFn: async (provider: ConnectorProvider) => {
            const res = await apiClient.post<ApiResponse<{ url: string }>>(
                CONNECTOR_LINK_URL(provider),
            );
            return res.data.data.url;
        },
    });
}
