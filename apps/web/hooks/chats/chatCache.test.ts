import { describe, expect, spyOn, test } from "bun:test";
import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import type { CursorPage, ReactionSummary } from "@trymatcha/types";
import {
    appendChatToNewestPage,
    addOptimisticChat,
    applyChatReaction,
    chatQueryKey,
    deleteChatFromCache,
    discoverChatQuote,
    expirePendingChatCreate,
    flattenChatPages,
    markChatDeleted,
    preservePrependScrollTop,
    receiveChat,
    reconcileChatCreate,
    rollbackChatCreate,
    shouldPrefetchOlderHistory,
} from "./chatCache";

type Message = {
    id: string;
    message: string;
    createdAt: Date;
    isDeleted: boolean;
    repliedToId: string | null;
    repliedTo: Message | null;
    reactions: ReactionSummary[];
    operationId?: string;
};

const message = (id: string, order: number, overrides: Partial<Message> = {}): Message => ({
    id,
    message: "same text",
    createdAt: new Date(2026, 0, 1, 0, order),
    isDeleted: false,
    repliedToId: null,
    repliedTo: null,
    reactions: [],
    ...overrides,
});

const page = (items: Message[], nextCursor: string | null): CursorPage<Message> => ({
    items,
    nextCursor,
    hasMore: nextCursor !== null,
});

const data = (): InfiniteData<CursorPage<Message>, string | null> => ({
    pages: [
        page([message("new-1", 5), message("new-2", 6)], "older-1"),
        page([message("old-1", 1), message("old-2", 2)], "older-2"),
        page([message("oldest", 0)], null),
    ],
    pageParams: [null, "older-1", "older-2"],
});

describe("chat infinite cache", () => {
    test("flattens older pages chronologically and gives the newest page duplicate priority", () => {
        const source = data();
        source.pages[1].items.push(message("new-1", 5, { message: "stale" }));

        expect(flattenChatPages(source.pages).map(({ id, message: text }) => [id, text])).toEqual([
            ["oldest", "same text"],
            ["old-1", "same text"],
            ["old-2", "same text"],
            ["new-1", "same text"],
            ["new-2", "same text"],
        ]);
    });

    test("reconciles only the matching operation and removes a server-ID duplicate", () => {
        const source = data();
        source.pages[0].items.push(
            message("optimistic:a", 7, { operationId: "a" }),
            message("optimistic:b", 8, { operationId: "b" }),
        );
        source.pages[1].items.push(message("server-a", 7, { message: "stale server copy" }));

        const result = reconcileChatCreate(source, message("server-a", 7), "a");
        const rows = flattenChatPages(result.pages);

        expect(rows.filter((row) => row.id === "server-a")).toHaveLength(1);
        expect(rows.some((row) => row.operationId === "a")).toBe(false);
        expect(rows.some((row) => row.operationId === "b")).toBe(true);
    });

    test("rolls back only the rejected operation", () => {
        const source = data();
        source.pages[0].items.push(
            message("optimistic:a", 7, { operationId: "a" }),
            message("optimistic:b", 8, { operationId: "b" }),
        );

        const rows = flattenChatPages(rollbackChatCreate(source, "a").pages);

        expect(rows.some((row) => row.operationId === "a")).toBe(false);
        expect(rows.some((row) => row.operationId === "b")).toBe(true);
    });

    test("updates a page-deep delete and every embedded reply tombstone", () => {
        const source = data();
        const target = source.pages[2].items[0];
        source.pages[0].items.push(
            message("reply-new", 8, { repliedToId: target.id, repliedTo: target }),
        );
        source.pages[1].items.push(
            message("reply-old", 3, { repliedToId: target.id, repliedTo: target }),
        );

        const rows = flattenChatPages(markChatDeleted(source, target.id).pages);

        expect(rows.find((row) => row.id === target.id)?.isDeleted).toBe(true);
        expect(
            rows
                .filter((row) => row.repliedToId === target.id)
                .every((row) => row.repliedTo?.isDeleted),
        ).toBe(true);
    });

    test("updates reactions on a page-deep row", () => {
        const reactions = [{ emoji: "👍", count: 2, reactedByViewer: true }];
        const result = applyChatReaction(data(), "oldest", () => reactions);

        expect(
            flattenChatPages(result.pages).find((row) => row.id === "oldest")?.reactions,
        ).toEqual(reactions);
    });

    test("keeps one socket insert at the newest edge while an older page arrives", () => {
        const incoming = message("live", 9);
        const withSocket = appendChatToNewestPage(data(), incoming);
        const withOlderFetch = {
            ...withSocket,
            pages: [...withSocket.pages, page([message("earlier", -1), incoming], null)],
            pageParams: [...withSocket.pageParams, "older-3"],
        };

        expect(flattenChatPages(withOlderFetch.pages).map((row) => row.id)).toEqual([
            "earlier",
            "oldest",
            "old-1",
            "old-2",
            "new-1",
            "new-2",
            "live",
        ]);
    });

    test("isolates issue, project, and team caches with identical conversation IDs", () => {
        const queryClient = new QueryClient();
        const sharedId = "same-scope-id";
        for (const kind of ["issue", "project", "team"] as const) {
            queryClient.setQueryData(chatQueryKey(kind, sharedId), data());
        }

        deleteChatFromCache<Message>(queryClient, "project", sharedId, "oldest");

        const issue = queryClient.getQueryData<InfiniteData<CursorPage<Message>>>(
            chatQueryKey("issue", sharedId),
        );
        const project = queryClient.getQueryData<InfiniteData<CursorPage<Message>>>(
            chatQueryKey("project", sharedId),
        );
        const team = queryClient.getQueryData<InfiniteData<CursorPage<Message>>>(
            chatQueryKey("team", sharedId),
        );
        expect(flattenChatPages(issue!.pages).find((row) => row.id === "oldest")?.isDeleted).toBe(
            false,
        );
        expect(flattenChatPages(project!.pages).find((row) => row.id === "oldest")?.isDeleted).toBe(
            true,
        );
        expect(flattenChatPages(team!.pages).find((row) => row.id === "oldest")?.isDeleted).toBe(
            false,
        );
    });

    test("invalidates an in-flight conversation when a socket row arrives before data", () => {
        const queryClient = new QueryClient();
        const invalidate = spyOn(queryClient, "invalidateQueries");

        receiveChat(queryClient, "issue", "issue-1", message("live", 9));

        expect(invalidate).toHaveBeenCalledWith({
            queryKey: chatQueryKey("issue", "issue-1"),
            exact: true,
        });
    });
});

describe("chat history navigation helpers", () => {
    test("prefetches before the reader reaches the start of loaded history", () => {
        expect(shouldPrefetchOlderHistory(479)).toBe(true);
        expect(shouldPrefetchOlderHistory(480)).toBe(true);
        expect(shouldPrefetchOlderHistory(481)).toBe(false);
    });

    test("finds a quote as soon as an older page loads it", async () => {
        let pages = 0;
        const messages: Message[] = [];
        const result = await discoverChatQuote({
            targetId: "target",
            getMessages: () => messages,
            hasOlder: () => true,
            fetchOlder: async () => {
                pages += 1;
                messages.push(message("target", 0));
            },
            isCurrent: () => true,
        });

        expect(result).toBe("found");
        expect(pages).toBe(1);
    });

    test("searches at most five pages and returns a continuation state", async () => {
        let pages = 0;
        const result = await discoverChatQuote({
            targetId: "missing",
            getMessages: () => [],
            hasOlder: () => true,
            fetchOlder: async () => {
                pages += 1;
            },
            isCurrent: () => true,
        });

        expect(result).toBe("window-exhausted");
        expect(pages).toBe(5);
    });

    test("distinguishes true exhaustion, retryable failure, and stale discovery", async () => {
        expect(
            await discoverChatQuote({
                targetId: "missing",
                getMessages: () => [],
                hasOlder: () => false,
                fetchOlder: async () => {},
                isCurrent: () => true,
            }),
        ).toBe("history-exhausted");
        expect(
            await discoverChatQuote({
                targetId: "missing",
                getMessages: () => [],
                hasOlder: () => true,
                fetchOlder: async () => {
                    throw new Error("network");
                },
                isCurrent: () => true,
            }),
        ).toBe("retryable-error");
        expect(
            await discoverChatQuote({
                targetId: "missing",
                getMessages: () => [],
                hasOlder: () => true,
                fetchOlder: async () => {},
                isCurrent: () => false,
            }),
        ).toBe("cancelled");
    });

    test("preserves the visible anchor after prepending measured content", () => {
        expect(preservePrependScrollTop(240, 800, 1125)).toBe(565);
    });
});

describe("chat create confirmation", () => {
    test("rolls back an unconfirmed optimistic row and reports its timeout", () => {
        const queryClient = new QueryClient();
        const invalidate = spyOn(queryClient, "invalidateQueries");
        let timedOut = false;
        const optimistic = { ...message("optimistic:send", 0), operationId: "send" };

        addOptimisticChat(queryClient, "project", "project-1", optimistic, "project-1", () => {
            timedOut = true;
        });
        expirePendingChatCreate(queryClient, "send");

        const data = queryClient.getQueryData<InfiniteData<CursorPage<Message>, string | null>>(
            chatQueryKey("project", "project-1"),
        );
        expect(flattenChatPages(data!.pages)).toEqual([]);
        expect(timedOut).toBe(true);
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: chatQueryKey("project", "project-1"),
            exact: true,
        });
    });
});
