import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { NOTIFICATIONS_READ_URL, NOTIFICATIONS_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { Notification } from "@trymatcha/types";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export type NotificationsData = {
    notifications: Notification[];
    unreadCount: number;
};

export function useNotifications() {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        enabled: Boolean(token),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<NotificationsData>>(NOTIFICATIONS_URL);
            return res.data.data;
        },
    });
}

export function useMarkNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: { ids?: string[] }) => {
            const res = await apiClient.patch<
                ApiResponse<{ updated: number; unreadCount: number }>
            >(NOTIFICATIONS_READ_URL, { ids: variables.ids });
            return res.data.data;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
            const previous = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);
            if (!previous) return { previous };

            const targeted = variables.ids ? new Set(variables.ids) : null;
            const readAt = new Date();
            let cleared = 0;

            const notifications = previous.notifications.map((notification) => {
                if (notification.readAt) return notification;
                if (targeted && !targeted.has(notification.id)) return notification;
                cleared += 1;
                return { ...notification, readAt };
            });

            queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, {
                notifications,
                unreadCount: Math.max(0, previous.unreadCount - cleared),
            });

            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        },
    });
}

export function upsert_notification(queryClient: QueryClient, notification: Notification) {
    queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        if (prev.notifications.some((existing) => existing.id === notification.id)) return prev;
        return {
            notifications: [notification, ...prev.notifications],
            unreadCount: notification.readAt ? prev.unreadCount : prev.unreadCount + 1,
        };
    });
}
