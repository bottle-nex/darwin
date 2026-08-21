import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { LabelledReference, TeamChat } from "@trymatcha/types";
import { apiClient } from "@/lib/axios";
import { TEAM_CHAT_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export const TEAM_CHATS_QUERY_KEY = ["team-chats"] as const;
const OPTIMISTIC_ID_PREFIX = "optimistic:";

export function useTeamChat(teamId: string | undefined) {
    return useQuery({
        queryKey: [...TEAM_CHATS_QUERY_KEY, teamId],
        enabled: Boolean(teamId),
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<{ chats: TeamChat[] }>>(
                TEAM_CHAT_URL(teamId!),
            );
            return response.data.data.chats;
        },
    });
}

export function build_optimistic_team_chat(
    teamId: string,
    message: string,
    references: LabelledReference[],
    repliedTo: TeamChat | null,
    sender: { id: string; name: string | null; email: string; image: string | null },
): TeamChat {
    return {
        id: `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`,
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

export function add_team_chat(queryClient: QueryClient, chat: TeamChat) {
    queryClient.setQueryData<TeamChat[]>([...TEAM_CHATS_QUERY_KEY, chat.teamId], (previous) =>
        previous ? [...previous, chat] : previous,
    );
}

export function mark_team_chat_deleted(queryClient: QueryClient, chat: TeamChat) {
    queryClient.setQueryData<TeamChat[]>([...TEAM_CHATS_QUERY_KEY, chat.teamId], (previous) =>
        previous?.map((existing) => {
            const next = existing.id === chat.id ? { ...existing, isDeleted: true } : existing;
            return next.repliedToId === chat.id && next.repliedTo
                ? { ...next, repliedTo: { ...next.repliedTo, isDeleted: true } }
                : next;
        }),
    );
}

export function upsert_team_chat(queryClient: QueryClient, chat: TeamChat) {
    queryClient.setQueryData<TeamChat[]>([...TEAM_CHATS_QUERY_KEY, chat.teamId], (previous) => {
        if (!previous) return previous;
        if (previous.some((existing) => existing.id === chat.id)) return previous;
        const pending_index = previous.findIndex(
            (existing) =>
                existing.id.startsWith(OPTIMISTIC_ID_PREFIX) &&
                existing.senderId === chat.senderId &&
                existing.message === chat.message,
        );
        if (pending_index === -1) return [...previous, chat];
        const next = [...previous];
        next[pending_index] = chat;
        return next;
    });
}
