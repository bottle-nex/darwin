import { format } from "date-fns";
import type { Notification } from "@trymatcha/types";
import type { NotificationFeedRow } from "@/types/notificationFeed.type";
import { day_label, notification_view } from "./notificationView";

export function matches_query(notification: Notification, query: string): boolean {
    const { actorName, action, body, issueRef, projectSlug } = notification_view(notification);
    return `${actorName} ${action} ${body} ${issueRef ?? ""} ${projectSlug ?? ""}`
        .toLowerCase()
        .includes(query);
}

export function filter_notifications(notifications: Notification[], query: string): Notification[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return notifications;
    return notifications.filter((notification) => matches_query(notification, trimmed));
}

export function flattenNotificationDayRows(notifications: Notification[]): NotificationFeedRow[] {
    const rows: NotificationFeedRow[] = [];
    const dayRowIndexes = new Map<string, number>();

    for (const notification of notifications) {
        const created = new Date(notification.createdAt);
        const dayKey = format(created, "yyyy-MM-dd");

        let dayIndex = dayRowIndexes.get(dayKey);
        if (dayIndex === undefined) {
            dayIndex = rows.length;
            dayRowIndexes.set(dayKey, dayIndex);
            rows.push({ kind: "day", key: `day:${dayKey}`, label: day_label(created), count: 0 });
        }

        const dayRow = rows[dayIndex];
        if (dayRow.kind === "day") dayRow.count += 1;

        rows.push({
            kind: "notification",
            key: `notification:${notification.id}`,
            notification,
        });
    }

    return rows;
}

export function stickyDayRowIndexes(rows: NotificationFeedRow[]): number[] {
    return rows.flatMap((row, index) => (row.kind === "day" ? [index] : []));
}
