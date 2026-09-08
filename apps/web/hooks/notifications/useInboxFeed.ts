"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Notification, NotificationFeedPage } from "@trydarwin/types";
import { isAxiosError } from "axios";
import { useMemo } from "react";

import { apiClient } from "@/lib/axios";
import { flattenInfinitePages } from "@/lib/pagination/infinitePages";
import { PROJECT_NOTIFICATIONS_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";

import { inboxNotificationsKey } from "./notificationCache";
import { NOTIFICATION_PAGE_LIMIT } from "./useMemberNotifications";

function is_forbidden(error: unknown) {
    return isAxiosError(error) && error.response?.status === 401;
}

export function useInboxFeed(projectId: string | undefined) {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    const query = useInfiniteQuery({
        queryKey: inboxNotificationsKey(projectId ?? ""),
        enabled: Boolean(projectId && token),
        initialPageParam: null as string | null,
        retry: (count, error) => !is_forbidden(error) && count < 1,
        queryFn: async ({ pageParam, signal }) => {
            const res = await apiClient.get<ApiResponse<NotificationFeedPage>>(
                PROJECT_NOTIFICATIONS_URL(projectId!, pageParam, NOTIFICATION_PAGE_LIMIT),
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

    return {
        ...query,
        notifications,
        unreadCount: query.data?.pages[0]?.unreadCount ?? 0,
        accessDenied: is_forbidden(query.error),
    };
}
