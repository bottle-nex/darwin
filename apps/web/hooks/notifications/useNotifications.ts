import { useQuery, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { NOTIFICATIONS_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { Notification } from "@trymatcha/types";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

/** Load the current user's notifications, most recent first. */
export function useNotifications() {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        enabled: Boolean(token),
        queryFn: async () => {
            const res =
                await apiClient.get<ApiResponse<{ notifications: Notification[] }>>(
                    NOTIFICATIONS_URL,
                );
            return res.data.data.notifications;
        },
    });
}

/**
 * Prepend a freshly pushed notification into the cached list, idempotently (by id).
 * No-ops if the list isn't loaded yet — it'll be fetched fresh next time the panel opens.
 */
export function upsert_notification(queryClient: QueryClient, notification: Notification) {
    queryClient.setQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        if (prev.some((existing) => existing.id === notification.id)) return prev;
        return [notification, ...prev];
    });
}
