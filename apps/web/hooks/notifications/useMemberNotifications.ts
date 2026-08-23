"use client";
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Notification, NotificationFeedPage } from "@trymatcha/types";
import { apiClient } from "@/lib/axios";
import { flattenInfinitePages } from "@/lib/pagination/infinitePages";
import { MEMBER_NOTIFICATIONS_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import { MEMBER_NOTIFICATIONS_QUERY_KEY } from "./notificationCache";

export const NOTIFICATION_PAGE_LIMIT = 30;

export function useMemberNotifications() {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    const query = useInfiniteQuery({
        queryKey: MEMBER_NOTIFICATIONS_QUERY_KEY,
        enabled: Boolean(token),
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam, signal }) => {
            const res = await apiClient.get<ApiResponse<NotificationFeedPage>>(
                MEMBER_NOTIFICATIONS_URL(pageParam, NOTIFICATION_PAGE_LIMIT),
                { signal },
            );
            return res.data.data;
        },
        getNextPageParam: (page) => page.nextCursor ?? undefined,
    });

    const notifications = useMemo<Notification[]>(
        () => (query.data ? flattenInfinitePages(query.data.pages) : []),
        [query.data],
    );

    return { ...query, notifications, unreadCount: query.data?.pages[0]?.unreadCount ?? 0 };
}
