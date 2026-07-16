import { useQuery, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { PROJECT_CHAT_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { ProjectChat } from "@trymatcha/types";

export const PROJECT_CHATS_QUERY_KEY = ["project-chats"] as const;

/** load all messages for one project's general chat, oldest first. */
export function useProjectChat(projectId: string | undefined) {
    return useQuery({
        queryKey: [...PROJECT_CHATS_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ chats: ProjectChat[] }>>(
                PROJECT_CHAT_URL(projectId!),
            );
            return res.data.data.chats;
        },
    });
}

/**
 * Append a chat into a project's cached list, idempotently (by id).
 * Called by the socket PROJECT_CHAT_CREATED handler. No-ops if the project's
 * list isn't loaded, it'll be fetched fresh when the project chat is opened.
 */
export function upsert_project_chat(queryClient: QueryClient, chat: ProjectChat) {
    queryClient.setQueryData<ProjectChat[]>(
        [...PROJECT_CHATS_QUERY_KEY, chat.projectId],
        (prev) => {
            if (!prev) return prev;
            if (prev.some((existing) => existing.id === chat.id)) return prev;
            return [...prev, chat];
        },
    );
}
