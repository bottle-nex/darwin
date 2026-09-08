import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { CursorPage, ReactionSummary } from "@trydarwin/types";

import { mapInfinitePages } from "@/lib/pagination/infinitePages";

export const CHAT_PAGE_LIMIT = 50;
export const CHAT_VIRTUAL_OVERSCAN = 6;
export const CHAT_AUTO_FILL_PAGE_CAP = 3;
export const CHAT_HISTORY_PREFETCH_DISTANCE = 480;
export const CHAT_QUOTE_DISCOVERY_PAGE_CAP = 5;
export const OPTIMISTIC_ID_PREFIX = "optimistic:";
export const CHAT_CREATE_TIMEOUT_MS = 8000;

export type ChatCacheKind = "issue" | "project" | "team";

export type ChatCacheItem<T> = T & {
    operationId?: string;
};

export type ChatInfiniteData<T> = InfiniteData<CursorPage<ChatCacheItem<T>>, string | null>;

type CacheChat = {
    id: string;
    isDeleted: boolean;
    repliedToId: string | null;
    repliedTo?: { id: string; isDeleted: boolean } | null;
    reactions?: ReactionSummary[];
    operationId?: string;
};

type PendingChatCreate = {
    kind: ChatCacheKind;
    conversationId: string;
    previewProjectId?: string;
    timeout: ReturnType<typeof setTimeout>;
    onTimeout?: () => void;
};

const pendingChatCreates = new Map<string, PendingChatCreate>();

function chatDataWithNewestItem<T extends CacheChat>(chat: ChatCacheItem<T>): ChatInfiniteData<T> {
    return {
        pages: [{ items: [chat], nextCursor: null, hasMore: false }],
        pageParams: [null],
    };
}

export type ChatQuoteDiscoveryResult =
    "found" | "window-exhausted" | "history-exhausted" | "retryable-error" | "cancelled";

export function shouldPrefetchOlderHistory(
    scrollTop: number,
    threshold = CHAT_HISTORY_PREFETCH_DISTANCE,
) {
    return scrollTop <= threshold;
}

export function chatQueryKey(kind: ChatCacheKind, conversationId: string | undefined) {
    const prefix = kind === "issue" ? "chats" : kind === "project" ? "project-chats" : "team-chats";
    return [prefix, conversationId] as const;
}

export function addOptimisticChat<T extends CacheChat>(
    queryClient: QueryClient,
    kind: ChatCacheKind,
    conversationId: string,
    chat: ChatCacheItem<T>,
    previewProjectId?: string,
    onTimeout?: () => void,
) {
    if (chat.operationId) {
        const operationId = chat.operationId;
        const timeout = setTimeout(() => {
            expirePendingChatCreate(queryClient, operationId);
        }, CHAT_CREATE_TIMEOUT_MS);
        pendingChatCreates.set(operationId, {
            kind,
            conversationId,
            previewProjectId,
            timeout,
            onTimeout,
        });
    }
    queryClient.setQueryData<ChatInfiniteData<T>>(chatQueryKey(kind, conversationId), (previous) =>
        previous ? appendChatToNewestPage(previous, chat) : chatDataWithNewestItem(chat),
    );
}

export function receiveChat<T extends CacheChat>(
    queryClient: QueryClient,
    kind: ChatCacheKind,
    conversationId: string,
    chat: ChatCacheItem<T>,
    operationId?: string,
) {
    if (operationId) {
        const pending = pendingChatCreates.get(operationId);
        if (pending) clearTimeout(pending.timeout);
        pendingChatCreates.delete(operationId);
    }
    const queryKey = chatQueryKey(kind, conversationId);
    if (!queryClient.getQueryData(queryKey)) {
        queryClient.invalidateQueries({ queryKey, exact: true });
        return;
    }
    queryClient.setQueryData<ChatInfiniteData<T>>(queryKey, (previous) =>
        previous
            ? operationId
                ? reconcileChatCreate(previous, chat, operationId)
                : appendChatToNewestPage(previous, chat)
            : previous,
    );
}

export function deleteChatFromCache<T extends CacheChat>(
    queryClient: QueryClient,
    kind: ChatCacheKind,
    conversationId: string,
    chatId: string,
) {
    const queryKey = chatQueryKey(kind, conversationId);
    if (!queryClient.getQueryData(queryKey)) {
        queryClient.invalidateQueries({ queryKey, exact: true });
        return;
    }
    queryClient.setQueryData<ChatInfiniteData<T>>(queryKey, (previous) =>
        previous ? markChatDeleted(previous, chatId) : previous,
    );
}

export function updateChatReactions<T extends CacheChat>(
    queryClient: QueryClient,
    kind: ChatCacheKind,
    conversationId: string,
    chatId: string,
    update: (reactions: ReactionSummary[]) => ReactionSummary[],
) {
    const queryKey = chatQueryKey(kind, conversationId);
    if (!queryClient.getQueryData(queryKey)) {
        queryClient.invalidateQueries({ queryKey, exact: true });
        return;
    }
    queryClient.setQueryData<ChatInfiniteData<T>>(queryKey, (previous) =>
        previous ? applyChatReaction(previous, chatId, update) : previous,
    );
}

export function rollbackPendingChatCreate(queryClient: QueryClient, operationId: string) {
    const pending = pendingChatCreates.get(operationId);
    if (!pending) return null;
    clearTimeout(pending.timeout);
    pendingChatCreates.delete(operationId);
    queryClient.setQueryData<ChatInfiniteData<CacheChat>>(
        chatQueryKey(pending.kind, pending.conversationId),
        (previous) => (previous ? rollbackChatCreate(previous, operationId) : previous),
    );
    return pending;
}

export function expirePendingChatCreate(queryClient: QueryClient, operationId: string) {
    const pending = rollbackPendingChatCreate(queryClient, operationId);
    if (pending) {
        queryClient.invalidateQueries({
            queryKey: chatQueryKey(pending.kind, pending.conversationId),
            exact: true,
        });
    }
    pending?.onTimeout?.();
    return pending;
}

export function flattenChatPages<T extends { id: string }>(
    pages: readonly CursorPage<ChatCacheItem<T>>[],
) {
    const newestValues = new Map<string, { item: ChatCacheItem<T>; pageIndex: number }>();
    pages.forEach((page, pageIndex) => {
        for (const item of page.items) {
            if (!newestValues.has(item.id)) newestValues.set(item.id, { item, pageIndex });
        }
    });

    const emitted = new Set<string>();
    const chronological: ChatCacheItem<T>[] = [];
    for (let pageIndex = pages.length - 1; pageIndex >= 0; pageIndex -= 1) {
        for (const item of pages[pageIndex].items) {
            if (emitted.has(item.id)) continue;
            const newestValue = newestValues.get(item.id);
            if (newestValue?.pageIndex !== pageIndex) continue;
            emitted.add(item.id);
            chronological.push(newestValue.item);
        }
    }
    return chronological;
}

function removeChatMatches<T extends CacheChat>(
    data: ChatInfiniteData<T>,
    predicate: (chat: ChatCacheItem<T>) => boolean,
) {
    return mapInfinitePages(data, (items) => {
        const next = items.filter((item) => !predicate(item));
        return next.length === items.length ? items : next;
    });
}

export function appendChatToNewestPage<T extends CacheChat>(
    data: ChatInfiniteData<T>,
    chat: ChatCacheItem<T>,
) {
    const deduplicated = removeChatMatches(data, (item) => item.id === chat.id);
    if (deduplicated.pages.length === 0) {
        return {
            ...deduplicated,
            pages: [{ items: [chat], nextCursor: null, hasMore: false }],
            pageParams: [null],
        };
    }
    const pages = deduplicated.pages.slice();
    pages[0] = { ...pages[0], items: [...pages[0].items, chat] };
    return { ...deduplicated, pages };
}

export function reconcileChatCreate<T extends CacheChat>(
    data: ChatInfiniteData<T>,
    confirmed: ChatCacheItem<T>,
    operationId: string,
) {
    const withoutServerDuplicate = removeChatMatches(data, (item) => item.id === confirmed.id);
    let reconciled = false;
    const next = mapInfinitePages(withoutServerDuplicate, (items) => {
        const operationIndex = items.findIndex((item) => item.operationId === operationId);
        if (operationIndex === -1) return items;
        const nextItems = items.slice();
        nextItems[operationIndex] = confirmed;
        reconciled = true;
        return nextItems;
    });
    return reconciled ? next : appendChatToNewestPage(next, confirmed);
}

export function rollbackChatCreate<T extends CacheChat>(
    data: ChatInfiniteData<T>,
    operationId: string,
) {
    return removeChatMatches(data, (item) => item.operationId === operationId);
}

export function markChatDeleted<T extends CacheChat>(data: ChatInfiniteData<T>, chatId: string) {
    return mapInfinitePages(data, (items) => {
        let changed = false;
        const nextItems = items.map((item) => {
            let next = item;
            if (item.id === chatId && !item.isDeleted) {
                next = { ...next, isDeleted: true };
                changed = true;
            }
            if (next.repliedToId === chatId && next.repliedTo && !next.repliedTo.isDeleted) {
                next = {
                    ...next,
                    repliedTo: { ...next.repliedTo, isDeleted: true },
                };
                changed = true;
            }
            return next;
        });
        return changed ? nextItems : items;
    });
}

export function applyChatReaction<T extends CacheChat>(
    data: ChatInfiniteData<T>,
    chatId: string,
    update: (reactions: ReactionSummary[]) => ReactionSummary[],
) {
    return mapInfinitePages(data, (items) => {
        const chatIndex = items.findIndex((item) => item.id === chatId);
        if (chatIndex === -1) return items;
        const nextItems = items.slice();
        nextItems[chatIndex] = {
            ...nextItems[chatIndex],
            reactions: update(nextItems[chatIndex].reactions ?? []),
        };
        return nextItems;
    });
}

export async function discoverChatQuote<T extends { id: string }>({
    targetId,
    getMessages,
    hasOlder,
    fetchOlder,
    isCurrent,
    onProgress,
}: {
    targetId: string;
    getMessages: () => readonly T[];
    hasOlder: () => boolean;
    fetchOlder: () => Promise<unknown>;
    isCurrent: () => boolean;
    onProgress?: (loadedPages: number) => void;
}): Promise<ChatQuoteDiscoveryResult> {
    if (getMessages().some((message) => message.id === targetId)) return "found";

    for (let page = 1; page <= CHAT_QUOTE_DISCOVERY_PAGE_CAP; page += 1) {
        if (!isCurrent()) return "cancelled";
        if (!hasOlder()) return "history-exhausted";
        onProgress?.(page);
        try {
            await fetchOlder();
        } catch {
            return isCurrent() ? "retryable-error" : "cancelled";
        }
        if (!isCurrent()) return "cancelled";
        if (getMessages().some((message) => message.id === targetId)) return "found";
    }

    return hasOlder() ? "window-exhausted" : "history-exhausted";
}

export function preservePrependScrollTop(
    previousScrollTop: number,
    previousScrollHeight: number,
    nextScrollHeight: number,
) {
    return previousScrollTop + Math.max(0, nextScrollHeight - previousScrollHeight);
}
