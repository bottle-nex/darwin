import { type QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPage, LabelledReference, TeamChat } from "@trymatcha/types";

import { apiClient } from "@/lib/axios";
import { TEAM_CHAT_URL } from "@/routes/api_routes";
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

export const TEAM_CHATS_QUERY_KEY = ["team-chats"] as const;

export function useTeamChat(teamId: string | undefined) {
    return useInfiniteQuery({
        queryKey: chatQueryKey("team", teamId),
        enabled: Boolean(teamId),
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam, signal }) => {
            const response = await apiClient.get<ApiResponse<CursorPage<TeamChat>>>(
                TEAM_CHAT_URL(teamId!, pageParam, CHAT_PAGE_LIMIT),
                { signal },
            );
            return response.data.data;
        },
        getNextPageParam: (page) => (page.hasMore ? page.nextCursor : undefined),
    });
}

export function build_optimistic_team_chat(
    teamId: string,
    operationId: string,
    message: string,
    references: LabelledReference[],
    repliedTo: TeamChat | null,
    sender: { id: string; name: string | null; email: string; image: string | null },
): ChatCacheItem<TeamChat> {
    return {
        id: `${OPTIMISTIC_ID_PREFIX}${operationId}`,
        operationId,
        teamId,
        message,
        isDeleted: false,
        senderId: sender.id,
        sender: sender as unknown as TeamChat["sender"],
        repliedToId: repliedTo?.id ?? null,
        repliedTo,
        references: references as TeamChat["references"],
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

export function add_team_chat(
    queryClient: QueryClient,
    chat: ChatCacheItem<TeamChat>,
    projectId?: string,
    onTimeout?: () => void,
) {
    addOptimisticChat(queryClient, "team", chat.teamId, chat, projectId, onTimeout);
}

export function mark_team_chat_deleted(queryClient: QueryClient, chat: TeamChat) {
    deleteChatFromCache<TeamChat>(queryClient, "team", chat.teamId, chat.id);
}

export function upsert_team_chat(queryClient: QueryClient, chat: TeamChat, operationId?: string) {
    receiveChat(queryClient, "team", chat.teamId, chat, operationId);
}
