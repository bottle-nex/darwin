import { describe, expect, test } from "bun:test";
import {
    MEMBER_NOTIFICATION_TYPES,
    NotificationType,
    PROJECT_NOTIFICATION_TYPES,
    notification_scope,
} from "@trymatcha/types";
import NotificationFeedService, {
    InvalidNotificationCursorError,
    type NotificationFeedScope,
} from "./service.notification-feed";

const viewer = "viewer-1";
const project_scope: NotificationFeedScope = {
    kind: "project",
    projectId: "project-a",
    viewerId: viewer,
};
const member_scope: NotificationFeedScope = { kind: "member", viewerId: viewer };

const createdAt = new Date("2026-08-23T10:00:00.000Z");

function row(id: string, timestamp = createdAt) {
    return { id, createdAt: timestamp };
}

describe("notification scope buckets", () => {
    test("every type belongs to exactly one bucket", () => {
        const all = Object.values(NotificationType);
        const project = new Set<string>(PROJECT_NOTIFICATION_TYPES);
        const member = new Set<string>(MEMBER_NOTIFICATION_TYPES);

        expect(project.size).toBe(12);
        expect(member.size).toBe(6);
        expect(project.size + member.size).toBe(all.length);
        expect(all.filter((type) => project.has(type) === member.has(type))).toEqual([]);
    });

    test("team chat mentions are project scoped", () => {
        expect(notification_scope(NotificationType.TeamChatMention)).toBe("project");
    });

    test("membership changes are member scoped", () => {
        for (const type of [
            NotificationType.AddedToProject,
            NotificationType.AddedToTeam,
            NotificationType.RemovedFromTeam,
            NotificationType.RemovedFromOrg,
            NotificationType.RoleChanged,
            NotificationType.InviteAccepted,
        ]) {
            expect(notification_scope(type)).toBe("member");
        }
    });
});

describe("NotificationFeedService.query_schema", () => {
    test("defaults the limit and accepts a valid cursor", () => {
        const cursor = NotificationFeedService.encode_cursor(member_scope, row("n1"));

        expect(NotificationFeedService.query_schema.parse({})).toEqual({ limit: 50 });
        expect(NotificationFeedService.query_schema.parse({ limit: "100", cursor })).toMatchObject({
            limit: 100,
            cursor: { id: "n1", createdAt },
        });
    });

    test("rejects out-of-range limits and malformed cursors", () => {
        for (const query of [
            { cursor: "not-a-cursor" },
            { cursor: "" },
            { limit: "0" },
            { limit: "-1" },
            { limit: "1.5" },
            { limit: "101" },
        ]) {
            expect(NotificationFeedService.query_schema.safeParse(query).success).toBe(false);
        }
    });
});

describe("NotificationFeedService cursor scoping", () => {
    test("a member cursor cannot be replayed against a project feed", () => {
        const cursor = NotificationFeedService.encode_cursor(member_scope, row("n1"));
        expect(() => NotificationFeedService.validate_cursor(cursor, project_scope)).toThrow(
            InvalidNotificationCursorError,
        );
    });

    test("a cursor from one project cannot be replayed against another", () => {
        const cursor = NotificationFeedService.encode_cursor(project_scope, row("n1"));
        expect(() =>
            NotificationFeedService.validate_cursor(cursor, {
                kind: "project",
                projectId: "project-b",
                viewerId: viewer,
            }),
        ).toThrow(InvalidNotificationCursorError);
    });

    test("another viewer's cursor is rejected", () => {
        const cursor = NotificationFeedService.encode_cursor(project_scope, row("n1"));
        expect(() =>
            NotificationFeedService.validate_cursor(cursor, {
                kind: "project",
                projectId: "project-a",
                viewerId: "viewer-2",
            }),
        ).toThrow(InvalidNotificationCursorError);
    });

    test("its own scope round-trips", () => {
        const cursor = NotificationFeedService.encode_cursor(project_scope, row("n1"));
        expect(NotificationFeedService.validate_cursor(cursor, project_scope)).toEqual({
            createdAt,
            id: "n1",
        });
    });

    test("no cursor means no keyset predicate", () => {
        expect(NotificationFeedService.cursor_where(undefined, member_scope)).toEqual({});
    });
});

describe("NotificationFeedService.create_page", () => {
    test("keeps newest-first order rather than reversing", () => {
        const newest = row("newest", new Date("2026-08-23T12:00:00.000Z"));
        const oldest = row("oldest", new Date("2026-08-23T08:00:00.000Z"));

        const page = NotificationFeedService.create_page([newest, oldest], 5, member_scope, 3);

        expect(page.items.map((item) => item.id)).toEqual(["newest", "oldest"]);
    });

    test("reports no more pages when the rows fit the limit", () => {
        const page = NotificationFeedService.create_page([row("a"), row("b")], 2, member_scope, 0);

        expect(page.hasMore).toBe(false);
        expect(page.nextCursor).toBeNull();
        expect(page.items).toHaveLength(2);
    });

    test("trims the extra row and emits a cursor at limit + 1", () => {
        const rows = [row("a"), row("b"), row("c")];
        const page = NotificationFeedService.create_page(rows, 2, member_scope, undefined);

        expect(page.hasMore).toBe(true);
        expect(page.items.map((item) => item.id)).toEqual(["a", "b"]);
        expect(page.nextCursor).not.toBeNull();
        expect(NotificationFeedService.validate_cursor(page.nextCursor, member_scope)).toEqual({
            createdAt,
            id: "b",
        });
    });

    test("omits unreadCount on later pages and includes it on the first", () => {
        expect(
            NotificationFeedService.create_page([row("a")], 5, member_scope, undefined),
        ).not.toHaveProperty("unreadCount");
        expect(NotificationFeedService.create_page([row("a")], 5, member_scope, 7)).toMatchObject({
            unreadCount: 7,
        });
        expect(NotificationFeedService.create_page([row("a")], 5, member_scope, 0)).toMatchObject({
            unreadCount: 0,
        });
    });
});

describe("NotificationFeedService.scope_filter", () => {
    test("the project feed pins projectId and the project type set", () => {
        expect(NotificationFeedService.scope_filter(project_scope)).toEqual({
            userId: viewer,
            projectId: "project-a",
            type: { in: PROJECT_NOTIFICATION_TYPES },
        });
    });

    test("the member feed requires a null projectId and the member type set", () => {
        expect(NotificationFeedService.scope_filter(member_scope)).toEqual({
            userId: viewer,
            projectId: null,
            type: { in: MEMBER_NOTIFICATION_TYPES },
        });
    });
});
