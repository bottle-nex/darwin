import { type QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPage, LabelledReference, ProjectChat } from "@trydarwin/types";

import { apiClient } from "@/lib/axios";
import { PROJECT_CHAT_URL } from "@/routes/api_routes";
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

export const PROJECT_CHATS_QUERY_KEY = ["project-chats"] as const;

export function useProjectChat(projectId: string | undefined) {
    return useInfiniteQuery({
        queryKey: chatQueryKey("project", projectId),
        enabled: Boolean(projectId),
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam, signal }) => {
            const response = await apiClient.get<ApiResponse<CursorPage<ProjectChat>>>(
                PROJECT_CHAT_URL(projectId!, pageParam, CHAT_PAGE_LIMIT),
                { signal },
            );
            return response.data.data;
        },
        getNextPageParam: (page) => (page.hasMore ? page.nextCursor : undefined),
    });
}

export function build_optimistic_project_chat(
    projectId: string,
    operationId: string,
    message: string,
    references: LabelledReference[],
    repliedTo: ProjectChat | null,
    sender: { id: string; name: string | null; email: string; image: string | null },
): ChatCacheItem<ProjectChat> {
    return {
        id: `${OPTIMISTIC_ID_PREFIX}${operationId}`,
        operationId,
        projectId,
        message,
        isDeleted: false,
        senderId: sender.id,
        sender: sender as unknown as ProjectChat["sender"],
        repliedToId: repliedTo?.id ?? null,
        repliedTo: repliedTo ?? null,
        references: references as ProjectChat["references"],
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

export function add_project_chat(
    queryClient: QueryClient,
    chat: ChatCacheItem<ProjectChat>,
    onTimeout?: () => void,
) {
    addOptimisticChat(queryClient, "project", chat.projectId, chat, chat.projectId, onTimeout);
}

export function mark_project_chat_deleted(queryClient: QueryClient, chat: ProjectChat) {
    deleteChatFromCache<ProjectChat>(queryClient, "project", chat.projectId, chat.id);
}

export function upsert_project_chat(
    queryClient: QueryClient,
    chat: ProjectChat,
    operationId?: string,
) {
    receiveChat(queryClient, "project", chat.projectId, chat, operationId);
}
