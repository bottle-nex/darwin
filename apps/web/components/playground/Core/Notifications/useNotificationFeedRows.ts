"use client";
import type { Notification } from "@trydarwin/types";
import { useMemo } from "react";

import {
    filter_notifications,
    flattenNotificationDayRows,
    stickyDayRowIndexes,
} from "./notificationRows";

export function useNotificationFeedRows(notifications: Notification[], query: string) {
    const matched = useMemo(
        () => filter_notifications(notifications, query),
        [notifications, query],
    );
    const rows = useMemo(() => flattenNotificationDayRows(matched), [matched]);
    const stickyRowIndexes = useMemo(() => stickyDayRowIndexes(rows), [rows]);

    return { matched, rows, stickyRowIndexes };
}
