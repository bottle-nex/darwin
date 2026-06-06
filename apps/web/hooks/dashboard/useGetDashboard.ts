import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { DASHBOARD_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { DashboardData } from "@/types/project";

export const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

/**
 * Fetch the dashboard for an org (by slug): the org plus its projects. Only runs
 * once the user is authenticated and an `orgSlug` is known.
 */
export function useGetDashboard(orgSlug: string | undefined) {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: [...DASHBOARD_QUERY_KEY, orgSlug],
        enabled: Boolean(token) && Boolean(orgSlug),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<DashboardData>>(DASHBOARD_URL(orgSlug!));
            return res.data.data;
        },
    });
}
