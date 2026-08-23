import type { QueryClient } from "@tanstack/react-query";
import {
    NotificationScope,
    notification_scope,
    type Notification,
    type NotificationFeedPage,
} from "@trymatcha/types";
import type { NotificationFeedData, NotificationReadTarget } from "@/types/notificationFeed.type";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const MEMBER_NOTIFICATIONS_QUERY_KEY = [...NOTIFICATIONS_QUERY_KEY, "member"] as const;
export const INBOX_NOTIFICATIONS_QUERY_KEY = [...NOTIFICATIONS_QUERY_KEY, "inbox"] as const;

export function inboxNotificationsKey(projectId: string) {
    return [...INBOX_NOTIFICATIONS_QUERY_KEY, projectId] as const;
}

export function notification_feed_key(notification: Notification): readonly string[] | null {
    if (notification_scope(notification.type) === NotificationScope.Member) {
        return MEMBER_NOTIFICATIONS_QUERY_KEY;
    }
    return notification.projectId ? inboxNotificationsKey(notification.projectId) : null;
}

export function read_target_for(notification: Notification): NotificationReadTarget {
    return notification_scope(notification.type) === NotificationScope.Project &&
        notification.projectId
        ? { scope: "project", projectId: notification.projectId, ids: [notification.id] }
        : { scope: "member", ids: [notification.id] };
}

export function read_target_key(target: NotificationReadTarget): readonly string[] {
    return target.scope === "project"
        ? inboxNotificationsKey(target.projectId)
        : MEMBER_NOTIFICATIONS_QUERY_KEY;
}

function with_unread(page: NotificationFeedPage, delta: number): NotificationFeedPage {
    if (page.unreadCount === undefined) return page;
    return { ...page, unreadCount: Math.max(0, page.unreadCount + delta) };
}

export function prepend_notification(
    data: NotificationFeedData,
    notification: Notification,
): NotificationFeedData {
    const first = data.pages[0];
    if (!first) return data;
    if (data.pages.some((page) => page.items.some((item) => item.id === notification.id))) {
        return data;
    }

    const pages = data.pages.slice();
    pages[0] = with_unread(
        { ...first, items: [notification, ...first.items] },
        notification.readAt ? 0 : 1,
    );
    return { ...data, pages };
}

export function apply_read_to_pages(
    data: NotificationFeedData,
    ids: string[] | undefined,
    readAt: Date,
): NotificationFeedData {
    const targeted = ids ? new Set(ids) : null;
    let cleared = 0;

    const pages = data.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => {
            if (item.readAt) return item;
            if (targeted && !targeted.has(item.id)) return item;
            cleared += 1;
            return { ...item, readAt };
        }),
    }));

    const first = pages[0];
    if (first) {
        pages[0] = targeted
            ? with_unread(first, -cleared)
            : { ...first, ...(first.unreadCount === undefined ? {} : { unreadCount: 0 }) };
    }

    return { ...data, pages };
}

export function set_unread_count(data: NotificationFeedData, unreadCount: number) {
    const first = data.pages[0];
    if (!first) return data;
    const pages = data.pages.slice();
    pages[0] = { ...first, unreadCount };
    return { ...data, pages };
}

export function upsert_notification(queryClient: QueryClient, notification: Notification) {
    const key = notification_feed_key(notification);
    if (!key) return;

    const previous = queryClient.getQueryData<NotificationFeedData>(key);
    if (!previous) {
        queryClient.invalidateQueries({ queryKey: key });
        return;
    }

    queryClient.setQueryData<NotificationFeedData>(
        key,
        prepend_notification(previous, notification),
    );
}
