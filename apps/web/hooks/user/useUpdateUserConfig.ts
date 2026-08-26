import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { DASHBOARD_QUERY_KEY } from "@/hooks/dashboard/useGetDashboard";
import { apiClient } from "@/lib/axios";
import { USER_CONFIG_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { DashboardData, UserConfig } from "@/types/project";

export function useUpdateUserConfig() {
    const queryClient = useQueryClient();
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const dashboardKey = [...DASHBOARD_QUERY_KEY, orgSlug];

    return useMutation({
        mutationFn: async (input: Partial<UserConfig>) => {
            const res = await apiClient.patch<ApiResponse<UserConfig>>(USER_CONFIG_URL, input);
            return res.data.data;
        },
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: dashboardKey });
            const previous = queryClient.getQueryData<DashboardData>(dashboardKey);
            if (previous) {
                queryClient.setQueryData<DashboardData>(dashboardKey, {
                    ...previous,
                    userConfig: { ...previous.userConfig, ...input },
                });
            }
            return { previous };
        },
        onSuccess: (userConfig) => {
            const current = queryClient.getQueryData<DashboardData>(dashboardKey);
            if (current)
                queryClient.setQueryData<DashboardData>(dashboardKey, {
                    ...current,
                    userConfig,
                });
        },
        onError: (_error, _input, context) => {
            if (context?.previous) queryClient.setQueryData(dashboardKey, context.previous);
        },
    });
}
