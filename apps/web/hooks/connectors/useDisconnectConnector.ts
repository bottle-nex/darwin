import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { CONNECTOR_URL } from "@/routes/api_routes";
import type { ConnectorProvider } from "@/types/connector.type";

import { CONNECTORS_QUERY_KEY } from "./useConnectors";

export function useDisconnectConnector() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (provider: ConnectorProvider) => {
            await apiClient.delete(CONNECTOR_URL(provider));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONNECTORS_QUERY_KEY });
        },
    });
}
