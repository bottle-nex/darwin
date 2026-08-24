"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { NOTIFICATIONS_READ_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { NotificationFeedData, NotificationReadTarget } from "@/types/notificationFeed.type";

import { apply_read_to_pages, read_target_key, set_unread_count } from "./notificationCache";

type MarkReadResult = { updated: number; unreadCount: number };

export function useMarkNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (target: NotificationReadTarget) => {
            const res = await apiClient.patch<ApiResponse<MarkReadResult>>(
                NOTIFICATIONS_READ_URL,
                target,
            );
            return res.data.data;
        },
        onMutate: async (target) => {
            const key = read_target_key(target);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<NotificationFeedData>(key);
            if (previous) {
                queryClient.setQueryData<NotificationFeedData>(
                    key,
                    apply_read_to_pages(previous, target.ids, new Date()),
                );
            }
            return { key, previous };
        },
        onError: (_error, _target, context) => {
            if (!context) return;
            if (context.previous) {
                queryClient.setQueryData(context.key, context.previous);
            }
            queryClient.invalidateQueries({ queryKey: context.key });
        },
        onSuccess: (result, target) => {
            const key = read_target_key(target);
            const current = queryClient.getQueryData<NotificationFeedData>(key);
            if (!current) return;
            queryClient.setQueryData(key, set_unread_count(current, result.unreadCount));
        },
    });
}
