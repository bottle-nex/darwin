import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { ChatConversationPreviews, ProjectChat, TeamChat } from "@trymatcha/types";
import { apiClient } from "@/lib/axios";
import { CHAT_CONVERSATION_PREVIEWS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export const CHAT_CONVERSATION_PREVIEWS_QUERY_KEY = ["chat-conversation-previews"] as const;

export function useChatConversationPreviews(projectId: string | undefined) {
    return useQuery({
        queryKey: [...CHAT_CONVERSATION_PREVIEWS_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<ChatConversationPreviews>>(
                CHAT_CONVERSATION_PREVIEWS_URL(projectId!),
            );
            return response.data.data;
        },
    });
}

export function update_project_conversation_preview(
    queryClient: QueryClient,
    projectId: string,
    chat: ProjectChat,
) {
    queryClient.setQueryData<ChatConversationPreviews>(
        [...CHAT_CONVERSATION_PREVIEWS_QUERY_KEY, projectId],
        (previous) => (previous ? { ...previous, project: chat } : previous),
    );
}

export function update_team_conversation_preview(
    queryClient: QueryClient,
    projectId: string,
    chat: TeamChat,
) {
    queryClient.setQueryData<ChatConversationPreviews>(
        [...CHAT_CONVERSATION_PREVIEWS_QUERY_KEY, projectId],
        (previous) => {
            if (!previous) return previous;
            const existing = previous.teams.some((preview) => preview.teamId === chat.teamId);
            return {
                ...previous,
                teams: existing
                    ? previous.teams.map((preview) =>
                          preview.teamId === chat.teamId
                              ? { ...preview, latestMessage: chat }
                              : preview,
                      )
                    : [...previous.teams, { teamId: chat.teamId, latestMessage: chat }],
            };
        },
    );
}

export function mark_project_conversation_preview_deleted(
    queryClient: QueryClient,
    projectId: string,
    chatId: string,
) {
    queryClient.setQueryData<ChatConversationPreviews>(
        [...CHAT_CONVERSATION_PREVIEWS_QUERY_KEY, projectId],
        (previous) =>
            previous?.project?.id === chatId
                ? {
                      ...previous,
                      project: { ...previous.project, isDeleted: true },
                  }
                : previous,
    );
}

export function mark_team_conversation_preview_deleted(
    queryClient: QueryClient,
    projectId: string,
    chat: Pick<TeamChat, "id" | "teamId">,
) {
    queryClient.setQueryData<ChatConversationPreviews>(
        [...CHAT_CONVERSATION_PREVIEWS_QUERY_KEY, projectId],
        (previous) =>
            previous
                ? {
                      ...previous,
                      teams: previous.teams.map((preview) => {
                          if (
                              preview.teamId !== chat.teamId ||
                              preview.latestMessage?.id !== chat.id
                          ) {
                              return preview;
                          }
                          return {
                              ...preview,
                              latestMessage: { ...preview.latestMessage, isDeleted: true },
                          };
                      }),
                  }
                : previous,
    );
}
