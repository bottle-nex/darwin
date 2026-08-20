"use client";
import { useMemo } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { useInboxStore } from "@/store/playground/useInboxStore";
import { notification_view } from "@/components/playground/Core/Notifications/notificationView";
import type { Notification } from "@trymatcha/types";

export function useInboxNotifications(): {
    notifications: Notification[];
    selected: Notification | null;
    unreadCount: number;
} {
    const projectSlug = useActiveProject()?.slug;
    const filter = useInboxStore((state) => state.filter);
    const selectedId = useInboxStore((state) => state.selectedId);
    const { data } = useNotifications();

    const forProject = useMemo(
        () =>
            (data?.notifications ?? []).filter(
                (notification) => notification_view(notification).projectSlug === projectSlug,
            ),
        [data?.notifications, projectSlug],
    );

    const notifications = useMemo(
        () =>
            filter === "unread"
                ? forProject.filter((notification) => !notification.readAt)
                : forProject,
        [forProject, filter],
    );

    return {
        notifications,
        selected: forProject.find((notification) => notification.id === selectedId) ?? null,
        unreadCount: forProject.filter((notification) => !notification.readAt).length,
    };
}
