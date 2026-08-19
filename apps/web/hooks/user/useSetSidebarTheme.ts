import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import { SIDEBAR_THEME_URL } from "@/routes/api_routes";
import { useSidebarThemeStore } from "@/store/playground/useSidebarThemeStore";
import type { SidebarTheme } from "@/types/sidebarTheme.type";
import { SIDEBAR_THEME_QUERY_KEY } from "./useSidebarTheme";

export function useSetSidebarTheme() {
    const queryClient = useQueryClient();
    const setTheme = useSidebarThemeStore((s) => s.setTheme);

    return useMutation({
        mutationFn: async (sidebarTheme: SidebarTheme) => {
            await apiClient.patch(SIDEBAR_THEME_URL, { sidebarTheme });
            return sidebarTheme;
        },
        onMutate: (sidebarTheme) => {
            const previousTheme = useSidebarThemeStore.getState().theme;
            setTheme(sidebarTheme);
            return { previousTheme };
        },
        onSuccess: (sidebarTheme) => {
            queryClient.setQueryData(SIDEBAR_THEME_QUERY_KEY, { sidebarTheme });
        },
        onError: (_error, _sidebarTheme, context) => {
            if (context) setTheme(context.previousTheme);
            toast.error("Failed to update sidebar theme");
        },
    });
}
