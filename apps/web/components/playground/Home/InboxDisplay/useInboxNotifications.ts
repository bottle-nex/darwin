"use client";
import { useEffect, useMemo } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useInboxFeed } from "@/hooks/notifications/useInboxFeed";
import { useInboxStore } from "@/store/playground/useInboxStore";

export function useInboxNotifications() {
    const projectId = useActiveProject()?.id;
    const filter = useInboxStore((state) => state.filter);
    const selectedId = useInboxStore((state) => state.selectedId);
    const select = useInboxStore((state) => state.select);
    const feed = useInboxFeed(projectId);

    useEffect(() => {
        select(null);
    }, [projectId, select]);

    const notifications = useMemo(
        () =>
            filter === "unread"
                ? feed.notifications.filter((notification) => !notification.readAt)
                : feed.notifications,
        [feed.notifications, filter],
    );

    return {
        projectId,
        feed,
        notifications,
        selected: feed.notifications.find((notification) => notification.id === selectedId) ?? null,
        unreadCount: feed.unreadCount,
    };
}
