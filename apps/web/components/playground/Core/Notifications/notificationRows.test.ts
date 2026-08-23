import { describe, expect, test } from "bun:test";
import { NotificationType, type Notification } from "@trymatcha/types";
import {
    filter_notifications,
    flattenNotificationDayRows,
    matches_query,
    stickyDayRowIndexes,
} from "./notificationRows";

function notification(id: string, createdAt: string, overrides: Partial<Notification> = {}) {
    return {
        id,
        userId: "viewer-1",
        projectId: "project-a",
        type: NotificationType.IssueAssigned,
        payload: {
            actorName: "Nadia Rahman",
            issueTitle: "OAuth callback drops updates",
            issueNumber: 39,
            projectSlug: "nocturn",
            orgSlug: "acme",
        },
        readAt: null,
        createdAt: new Date(createdAt),
        ...overrides,
    } as Notification;
}

const page_one = [
    notification("a1", "2026-08-22T18:00:00.000Z"),
    notification("a2", "2026-08-22T15:00:00.000Z"),
    notification("a3", "2026-08-22T12:00:00.000Z"),
];

const page_two = [
    notification("b1", "2026-08-22T09:00:00.000Z"),
    notification("b2", "2026-08-22T08:00:00.000Z"),
    notification("b3", "2026-08-21T22:00:00.000Z"),
];

const day_rows = (rows: ReturnType<typeof flattenNotificationDayRows>) =>
    rows.filter((row) => row.kind === "day");

describe("flattenNotificationDayRows", () => {
    test("emits exactly one day row per calendar day across concatenated pages", () => {
        const rows = flattenNotificationDayRows([...page_one, ...page_two]);
        const days = day_rows(rows);

        expect(days).toHaveLength(2);
        expect(new Set(days.map((row) => row.key)).size).toBe(2);
    });

    test("flattening page by page would duplicate the shared day header", () => {
        const perPage = [
            ...flattenNotificationDayRows(page_one),
            ...flattenNotificationDayRows(page_two),
        ];
        const duplicated = day_rows(perPage).filter((row) => row.key === "day:2026-08-22");

        expect(duplicated).toHaveLength(2);
        expect(day_rows(flattenNotificationDayRows([...page_one, ...page_two]))).toHaveLength(2);
    });

    test("keeps notification order untouched", () => {
        const rows = flattenNotificationDayRows([...page_one, ...page_two]);
        const ids = rows.flatMap((row) =>
            row.kind === "notification" ? [row.notification.id] : [],
        );

        expect(ids).toEqual(["a1", "a2", "a3", "b1", "b2", "b3"]);
    });

    test("counts the notifications under each day", () => {
        const days = day_rows(flattenNotificationDayRows([...page_one, ...page_two]));

        expect(days.map((row) => row.count)).toEqual([5, 1]);
    });

    test("keys days by ISO date so a midnight rollover cannot stale the key", () => {
        const days = day_rows(flattenNotificationDayRows([...page_one, ...page_two]));

        expect(days.map((row) => row.key)).toEqual(["day:2026-08-22", "day:2026-08-21"]);
    });

    test("handles a single day and an empty feed", () => {
        expect(day_rows(flattenNotificationDayRows(page_one))).toHaveLength(1);
        expect(flattenNotificationDayRows([])).toEqual([]);
    });
});

describe("stickyDayRowIndexes", () => {
    test("points at every day row and nothing else", () => {
        const rows = flattenNotificationDayRows([...page_one, ...page_two]);
        const indexes = stickyDayRowIndexes(rows);

        expect(indexes).toEqual([0, 6]);
        for (const index of indexes) expect(rows[index].kind).toBe("day");
    });

    test("is empty for an empty feed", () => {
        expect(stickyDayRowIndexes([])).toEqual([]);
    });
});

describe("matches_query", () => {
    const target = notification("a1", "2026-08-22T18:00:00.000Z");

    test("matches actor, action, body, issue ref and project slug", () => {
        for (const query of ["nadia", "assigned", "oauth", "39", "nocturn"]) {
            expect(matches_query(target, query)).toBe(true);
        }
    });

    test("misses unrelated text", () => {
        expect(matches_query(target, "webhook retry")).toBe(false);
    });
});

describe("filter_notifications", () => {
    test("returns the same array when the query is blank", () => {
        expect(filter_notifications(page_one, "   ")).toBe(page_one);
    });

    test("narrows to matching rows and is case insensitive", () => {
        const mixed = [
            notification("keep", "2026-08-22T18:00:00.000Z"),
            notification("drop", "2026-08-22T17:00:00.000Z", {
                payload: {
                    actorName: "Tomas Novak",
                    issueTitle: "Redis keyspace",
                    projectSlug: "x",
                },
            }),
        ];

        expect(filter_notifications(mixed, "NADIA").map((item) => item.id)).toEqual(["keep"]);
    });
});
