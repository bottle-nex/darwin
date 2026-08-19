import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { SIDEBAR_THEME_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { SidebarThemePreference } from "@/types/sidebarTheme.type";

export const SIDEBAR_THEME_QUERY_KEY = ["user", "sidebar-theme"] as const;

export function useSidebarTheme() {
    const token = useUserSessionStore((s) => s.session?.user?.token);

    return useQuery({
        queryKey: SIDEBAR_THEME_QUERY_KEY,
        enabled: Boolean(token),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<SidebarThemePreference>>(SIDEBAR_THEME_URL);
            return res.data.data;
        },
    });
}
