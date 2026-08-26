import { describe, expect, test } from "bun:test";

import ChatHistoryService, {
    CHAT_HISTORY_INCLUDE,
    InvalidChatHistoryCursorError,
} from "./service.chat-history";

const scope = {
    kind: "project-chat" as const,
    parentId: "project-1",
    viewerId: "viewer-1",
};

const createdAt = new Date("2026-08-22T12:34:56.789Z");

function row(id: string, timestamp = createdAt) {
    return {
        id,
        createdAt: timestamp,
        message: `message-${id}`,
        sender: { id: `sender-${id}` },
        repliedTo: { id: `reply-${id}`, sender: { id: `reply-sender-${id}` } },
        references: [{ id: `reference-${id}` }],
    };
}

describe("ChatHistoryService", () => {
    test("validates the bounded history query before a history read", () => {
        const cursor = ChatHistoryService.encode_cursor(scope, row("message-1"));

        expect(ChatHistoryService.query_schema.parse({})).toEqual({ limit: 50 });
        expect(ChatHistoryService.query_schema.parse({ limit: "100", cursor })).toMatchObject({
            limit: 100,
            cursor: { id: "message-1", createdAt },
        });

        for (const query of [
            { cursor: "not-a-history-cursor" },
            { limit: "0" },
            { limit: "-1" },
            { limit: "1.5" },
            { limit: "101" },
        ]) {
            expect(ChatHistoryService.query_schema.safeParse(query).success).toBe(false);
        }
    });

    test("rejects cursors from another history kind, parent, or viewer", () => {
        const cursor = ChatHistoryService.encode_cursor(scope, row("message-1"));
        const parsed = ChatHistoryService.query_schema.parse({ cursor }).cursor;

        expect(ChatHistoryService.validate_cursor(parsed, scope)).toMatchObject({
            id: "message-1",
            createdAt,
        });
        expect(() =>
            ChatHistoryService.validate_cursor(parsed, { ...scope, kind: "team-chat" }),
        ).toThrow(InvalidChatHistoryCursorError);
        expect(() =>
            ChatHistoryService.validate_cursor(parsed, { ...scope, parentId: "project-2" }),
        ).toThrow(InvalidChatHistoryCursorError);
        expect(() =>
            ChatHistoryService.validate_cursor(parsed, { ...scope, viewerId: "viewer-2" }),
        ).toThrow(InvalidChatHistoryCursorError);
    });

    test("uses a deletion-safe tuple predicate", () => {
        const cursor = ChatHistoryService.encode_cursor(scope, row("deleted-message"));
        const parsed = ChatHistoryService.query_schema.parse({ cursor }).cursor;

        expect(ChatHistoryService.cursor_where(parsed, scope)).toEqual({
            OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: "deleted-message" } }],
        });
    });

    test("returns newest bounded rows in chronological display order", () => {
        const rows = [row("d"), row("c"), row("b")];
        const reactions = new Map([
            ["d", [{ emoji: "thumbs-up", count: 2, reactedByViewer: true }]],
        ]);

        const page = ChatHistoryService.create_page(rows, 2, scope, reactions);

        expect(page.items.map((item) => item.id)).toEqual(["c", "d"]);
        expect(page.items[1]).toMatchObject({
            sender: { id: "sender-d" },
            repliedTo: { sender: { id: "reply-sender-d" } },
            references: [{ id: "reference-d" }],
            reactions: [{ emoji: "thumbs-up", count: 2, reactedByViewer: true }],
        });
        expect(page.items[0].reactions).toEqual([]);
        expect(page.hasMore).toBe(true);
        expect(ChatHistoryService.validate_cursor(page.nextCursor, scope)).toMatchObject({
            id: "c",
        });
    });

    test("covers equal-timestamp adjacent pages without duplicates", () => {
        const first = ChatHistoryService.create_page([row("d"), row("c"), row("b")], 2, scope);
        const second = ChatHistoryService.create_page([row("b"), row("a")], 2, scope);
        const ids = [...first.items, ...second.items].map((item) => item.id);

        expect(first.items.map((item) => item.id)).toEqual(["c", "d"]);
        expect(second.items.map((item) => item.id)).toEqual(["a", "b"]);
        expect(new Set(ids).size).toBe(ids.length);
        expect(second).toMatchObject({ nextCursor: null, hasMore: false });
    });

    test("returns an empty terminal page", () => {
        expect(ChatHistoryService.create_page([], 50, scope)).toEqual({
            items: [],
            nextCursor: null,
            hasMore: false,
        });
    });

    test("shares the sender, reply sender, and reference include contract", () => {
        expect(CHAT_HISTORY_INCLUDE).toEqual({
            sender: true,
            repliedTo: { include: { sender: true } },
            references: { include: expect.any(Object) },
        });
    });
});
