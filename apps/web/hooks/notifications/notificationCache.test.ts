import { QueryClient } from "@tanstack/react-query";
import { type Notification, NotificationType } from "@trymatcha/types";
import { describe, expect, test } from "bun:test";

import type { NotificationFeedData } from "@/types/notificationFeed.type";

import {
    apply_read_to_pages,
    inboxNotificationsKey,
    MEMBER_NOTIFICATIONS_QUERY_KEY,
    notification_feed_key,
    prepend_notification,
    read_target_for,
    read_target_key,
    set_unread_count,
    upsert_notification,
} from "./notificationCache";

function notification(id: string, overrides: Partial<Notification> = {}): Notification {
    return {
        id,
        userId: "viewer-1",
        projectId: "project-a",
        type: NotificationType.IssueAssigned,
        payload: {},
        readAt: null,
        createdAt: new Date("2026-08-23T10:00:00.000Z"),
        ...overrides,
    } as Notification;
}

const member = notification("m1", {
    type: NotificationType.RemovedFromTeam,
    projectId: null,
});

function feed(items: Notification[], unreadCount: number | undefined): NotificationFeedData {
    return {
        pages: [
            {
                items,
                nextCursor: null,
                hasMore: false,
                ...(unreadCount === undefined ? {} : { unreadCount }),
            },
        ],
        pageParams: [null],
    };
}

describe("notification_feed_key", () => {
    test("routes member types to the bell cache", () => {
        expect(notification_feed_key(member)).toEqual(MEMBER_NOTIFICATIONS_QUERY_KEY);
    });

    test("routes project types to that project's inbox cache", () => {
        expect(notification_feed_key(notification("a1"))).toEqual(
            inboxNotificationsKey("project-a"),
        );
    });

    test("returns null for a project type with no projectId", () => {
        expect(notification_feed_key(notification("a1", { projectId: null }))).toBeNull();
    });
});

describe("read_target_for and read_target_key", () => {
    test("a project notification targets its own project scope", () => {
        const target = read_target_for(notification("a1"));
        expect(target).toEqual({ scope: "project", projectId: "project-a", ids: ["a1"] });
        expect(read_target_key(target)).toEqual(inboxNotificationsKey("project-a"));
    });

    test("a member notification targets the member scope", () => {
        const target = read_target_for(member);
        expect(target).toEqual({ scope: "member", ids: ["m1"] });
        expect(read_target_key(target)).toEqual(MEMBER_NOTIFICATIONS_QUERY_KEY);
    });

    test("a project type with no projectId falls back to member scope", () => {
        expect(read_target_for(notification("a1", { projectId: null }))).toEqual({
            scope: "member",
            ids: ["a1"],
        });
    });
});

describe("prepend_notification", () => {
    test("prepends to the first page and bumps the unread count", () => {
        const next = prepend_notification(feed([notification("a1")], 1), notification("a2"));

        expect(next.pages[0].items.map((item) => item.id)).toEqual(["a2", "a1"]);
        expect(next.pages[0].unreadCount).toBe(2);
    });

    test("does not bump the count for an already-read arrival", () => {
        const read = notification("a2", { readAt: new Date("2026-08-23T11:00:00.000Z") });
        expect(prepend_notification(feed([notification("a1")], 1), read).pages[0].unreadCount).toBe(
            1,
        );
    });

    test("leaves an absent unread count absent", () => {
        const next = prepend_notification(
            feed([notification("a1")], undefined),
            notification("a2"),
        );
        expect(next.pages[0]).not.toHaveProperty("unreadCount");
    });

    test("is a no-op for a duplicate id", () => {
        const data = feed([notification("a1")], 1);
        expect(prepend_notification(data, notification("a1"))).toBe(data);
    });

    test("is a no-op when there are no pages", () => {
        const empty: NotificationFeedData = { pages: [], pageParams: [] };
        expect(prepend_notification(empty, notification("a1"))).toBe(empty);
    });
});

describe("apply_read_to_pages", () => {
    const readAt = new Date("2026-08-23T12:00:00.000Z");

    test("stamps only the targeted ids and decrements by rows actually cleared", () => {
        const data = feed([notification("a1"), notification("a2")], 2);
        const next = apply_read_to_pages(data, ["a1"], readAt);

        expect(next.pages[0].items[0].readAt).toEqual(readAt);
        expect(next.pages[0].items[1].readAt).toBeNull();
        expect(next.pages[0].unreadCount).toBe(1);
    });

    test("marks every unread row when no ids are given", () => {
        const next = apply_read_to_pages(
            feed([notification("a1"), notification("a2")], 2),
            undefined,
            readAt,
        );

        expect(next.pages[0].items.every((item) => item.readAt !== null)).toBe(true);
        expect(next.pages[0].unreadCount).toBe(0);
    });

    test("a mark-all zeroes the count rather than subtracting only the loaded rows", () => {
        const next = apply_read_to_pages(feed([notification("a1")], 200), undefined, readAt);

        expect(next.pages[0].unreadCount).toBe(0);
    });

    test("a mark-all leaves an absent count absent", () => {
        const next = apply_read_to_pages(feed([notification("a1")], undefined), undefined, readAt);

        expect(next.pages[0]).not.toHaveProperty("unreadCount");
    });

    test("is idempotent over already-read rows", () => {
        const data = feed([notification("a1", { readAt })], 0);
        expect(apply_read_to_pages(data, ["a1"], readAt).pages[0].unreadCount).toBe(0);
    });

    test("never drives the count below zero", () => {
        const next = apply_read_to_pages(feed([notification("a1")], 0), ["a1"], readAt);
        expect(next.pages[0].unreadCount).toBe(0);
    });
});

describe("set_unread_count", () => {
    test("overwrites the first page count", () => {
        expect(set_unread_count(feed([notification("a1")], 5), 2).pages[0].unreadCount).toBe(2);
    });
});

describe("upsert_notification", () => {
    test("prepends into a warm cache", () => {
        const client = new QueryClient();
        const key = inboxNotificationsKey("project-a");
        client.setQueryData(key, feed([notification("a1")], 1));

        upsert_notification(client, notification("a2"));

        const data = client.getQueryData<NotificationFeedData>(key);
        expect(data?.pages[0].items.map((item) => item.id)).toEqual(["a2", "a1"]);
    });

    test("writes nothing into a cold cache", () => {
        const client = new QueryClient();
        upsert_notification(client, notification("a2"));

        expect(client.getQueryData(inboxNotificationsKey("project-a"))).toBeUndefined();
    });

    test("ignores a project notification with no projectId", () => {
        const client = new QueryClient();
        upsert_notification(client, notification("a2", { projectId: null }));

        expect(client.getQueryData(MEMBER_NOTIFICATIONS_QUERY_KEY)).toBeUndefined();
    });
});
