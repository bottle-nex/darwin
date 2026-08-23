import type { Notification, NotificationFeedPage } from "@trymatcha/types";
import type { InfiniteData } from "@tanstack/react-query";

export type NotificationFeedData = InfiniteData<NotificationFeedPage, string | null>;

export type NotificationReadTarget =
    { scope: "project"; projectId: string; ids?: string[] } | { scope: "member"; ids?: string[] };

export type NotificationFeedRow =
    | { kind: "day"; key: string; label: string; count: number }
    | { kind: "notification"; key: string; notification: Notification };
