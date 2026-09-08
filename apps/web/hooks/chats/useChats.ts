import { type QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { Chat, CursorPage, LabelledReference } from "@trydarwin/types";

import { apiClient } from "@/lib/axios";
import { CHAT_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import {
    addOptimisticChat,
    CHAT_PAGE_LIMIT,
    type ChatCacheItem,
    chatQueryKey,
    deleteChatFromCache,
    OPTIMISTIC_ID_PREFIX,
    receiveChat,
} from "./chatCache";

export const CHATS_QUERY_KEY = ["chats"] as const;
export { OPTIMISTIC_ID_PREFIX };

export function useChats(issueId: string | undefined) {
    return useInfiniteQuery({
        queryKey: chatQueryKey("issue", issueId),
        enabled: Boolean(issueId),
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam, signal }) => {
            const response = await apiClient.get<ApiResponse<CursorPage<Chat>>>(
                CHAT_URL(issueId!, pageParam, CHAT_PAGE_LIMIT),
                { signal },
            );
            return response.data.data;
        },
        getNextPageParam: (page) => (page.hasMore ? page.nextCursor : undefined),
    });
}

export function build_optimistic_chat(
    issueId: string,
    operationId: string,
    message: string,
    references: LabelledReference[],
    repliedTo: Chat | null,
    sender: { id: string; name: string | null; email: string; image: string | null },
): ChatCacheItem<Chat> {
    return {
        id: `${OPTIMISTIC_ID_PREFIX}${operationId}`,
        operationId,
        issueId,
        message,
        isDeleted: false,
        senderId: sender.id,
        sender: sender as unknown as Chat["sender"],
        repliedToId: repliedTo?.id ?? null,
        repliedTo: repliedTo ?? null,
        references: references as Chat["references"],
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

export function add_chat(
    queryClient: QueryClient,
    chat: ChatCacheItem<Chat>,
    onTimeout?: () => void,
) {
    addOptimisticChat(queryClient, "issue", chat.issueId, chat, undefined, onTimeout);
}

export function mark_chat_deleted(queryClient: QueryClient, chat: Chat) {
    deleteChatFromCache<Chat>(queryClient, "issue", chat.issueId, chat.id);
}

export function upsert_chat(queryClient: QueryClient, chat: Chat, operationId?: string) {
    receiveChat(queryClient, "issue", chat.issueId, chat, operationId);
}
