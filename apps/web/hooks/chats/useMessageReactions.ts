import { useSyncExternalStore } from "react";
import type { QueryClient } from "@tanstack/react-query";
import {
    InboundSocketMessageType,
    type Chat,
    type ProjectChat,
    apply_reaction_deltas,
    apply_reaction_updates,
    get_reaction_selection,
    type ReactionDelta,
    type ReactionSummary,
} from "@trymatcha/types";
import { send_socket_message } from "@/hooks/socket/useWebSocket";
import { CHATS_QUERY_KEY } from "./useChats";
import { PROJECT_CHATS_QUERY_KEY } from "./useProjectChat";

type ReactionEvent = {
    chatId: string;
    updates: { emoji: string; count: number; actorReacted: boolean }[];
    actorId: string;
    operationId: string;
};

type PendingReaction = {
    queryClient: QueryClient;
    kind: "chat" | "project";
    conversationId: string;
    chatId: string;
    rollback: ReactionDelta[];
    timeout: ReturnType<typeof setTimeout>;
};

const REACTION_TIMEOUT_MS = 8000;

const pending_reactions = new Map<string, PendingReaction>();
const pending_listeners = new Set<() => void>();
let pending_chat_ids: ReadonlySet<string> = new Set();

function publish_pending() {
    pending_chat_ids = new Set([...pending_reactions.values()].map((pending) => pending.chatId));
    for (const notify of pending_listeners) notify();
}

function subscribe_pending(notify: () => void) {
    pending_listeners.add(notify);
    return () => {
        pending_listeners.delete(notify);
    };
}

function settle_reaction(operationId: string) {
    const pending = pending_reactions.get(operationId);
    if (!pending) return null;
    clearTimeout(pending.timeout);
    pending_reactions.delete(operationId);
    publish_pending();
    return pending;
}

function is_reaction_pending(chatId: string) {
    return pending_chat_ids.has(chatId);
}

export function useReactionPending(chatId: string) {
    return useSyncExternalStore(
        subscribe_pending,
        () => is_reaction_pending(chatId),
        () => false,
    );
}

function set_chat_reactions(
    queryClient: QueryClient,
    issueId: string,
    chatId: string,
    reactions: ReactionSummary[],
) {
    queryClient.setQueryData<Chat[]>([...CHATS_QUERY_KEY, issueId], (previous) =>
        previous?.map((chat) => (chat.id === chatId ? { ...chat, reactions } : chat)),
    );
}

function set_project_chat_reactions(
    queryClient: QueryClient,
    projectId: string,
    chatId: string,
    reactions: ReactionSummary[],
) {
    queryClient.setQueryData<ProjectChat[]>([...PROJECT_CHATS_QUERY_KEY, projectId], (previous) =>
        previous?.map((chat) => (chat.id === chatId ? { ...chat, reactions } : chat)),
    );
}

function set_reactions(pending: PendingReaction, reactions: ReactionSummary[]) {
    if (pending.kind === "chat") {
        set_chat_reactions(pending.queryClient, pending.conversationId, pending.chatId, reactions);
    } else {
        set_project_chat_reactions(
            pending.queryClient,
            pending.conversationId,
            pending.chatId,
            reactions,
        );
    }
}

function optimistic_toggle(
    queryClient: QueryClient,
    kind: PendingReaction["kind"],
    conversationId: string,
    chat: Chat | ProjectChat,
    emoji: string,
) {
    if (is_reaction_pending(chat.id)) return null;
    const operationId = crypto.randomUUID();
    const previous = chat.reactions ?? [];
    const selection = get_reaction_selection(previous, emoji);
    const pending: PendingReaction = {
        queryClient,
        kind,
        conversationId,
        chatId: chat.id,
        rollback: selection.rollback,
        timeout: setTimeout(() => rollback_reaction(operationId), REACTION_TIMEOUT_MS),
    };
    pending_reactions.set(operationId, pending);
    publish_pending();
    set_reactions(pending, selection.reactions);
    return operationId;
}

export function toggle_chat_reaction(queryClient: QueryClient, chat: Chat, emoji: string) {
    const operationId = optimistic_toggle(queryClient, "chat", chat.issueId, chat, emoji);
    if (!operationId) return false;
    const sent = send_socket_message({
        type: InboundSocketMessageType.CHAT_REACTION_TOGGLE,
        payload: { chatId: chat.id, emoji, operationId },
    });
    if (!sent) rollback_reaction(operationId);
    return sent;
}

export function toggle_project_chat_reaction(
    queryClient: QueryClient,
    chat: ProjectChat,
    emoji: string,
) {
    const operationId = optimistic_toggle(queryClient, "project", chat.projectId, chat, emoji);
    if (!operationId) return false;
    const sent = send_socket_message({
        type: InboundSocketMessageType.PROJECT_CHAT_REACTION_TOGGLE,
        payload: { chatId: chat.id, emoji, operationId },
    });
    if (!sent) rollback_reaction(operationId);
    return sent;
}

export function reconcile_chat_reaction(
    queryClient: QueryClient,
    issueId: string,
    event: ReactionEvent,
    viewerId?: string,
) {
    queryClient.setQueryData<Chat[]>([...CHATS_QUERY_KEY, issueId], (previous) =>
        previous?.map((chat) => {
            if (chat.id !== event.chatId) return chat;
            const existing = chat.reactions ?? [];
            return {
                ...chat,
                reactions: apply_reaction_updates(
                    existing,
                    event.updates.map((update) => ({
                        emoji: update.emoji,
                        count: update.count,
                        reactedByViewer:
                            event.actorId === viewerId
                                ? update.actorReacted
                                : (existing.find((reaction) => reaction.emoji === update.emoji)
                                      ?.reactedByViewer ?? false),
                    })),
                ),
            };
        }),
    );
    settle_reaction(event.operationId);
}

export function reconcile_project_chat_reaction(
    queryClient: QueryClient,
    projectId: string,
    event: ReactionEvent,
    viewerId?: string,
) {
    queryClient.setQueryData<ProjectChat[]>([...PROJECT_CHATS_QUERY_KEY, projectId], (previous) =>
        previous?.map((chat) => {
            if (chat.id !== event.chatId) return chat;
            const existing = chat.reactions ?? [];
            return {
                ...chat,
                reactions: apply_reaction_updates(
                    existing,
                    event.updates.map((update) => ({
                        emoji: update.emoji,
                        count: update.count,
                        reactedByViewer:
                            event.actorId === viewerId
                                ? update.actorReacted
                                : (existing.find((reaction) => reaction.emoji === update.emoji)
                                      ?.reactedByViewer ?? false),
                    })),
                ),
            };
        }),
    );
    settle_reaction(event.operationId);
}

export function rollback_reaction(operationId: string) {
    const pending = settle_reaction(operationId);
    if (!pending) return;
    if (pending.kind === "chat") {
        pending.queryClient.setQueryData<Chat[]>(
            [...CHATS_QUERY_KEY, pending.conversationId],
            (previous) =>
                previous?.map((chat) =>
                    chat.id === pending.chatId
                        ? {
                              ...chat,
                              reactions: apply_reaction_deltas(
                                  chat.reactions ?? [],
                                  pending.rollback,
                              ),
                          }
                        : chat,
                ),
        );
    } else {
        pending.queryClient.setQueryData<ProjectChat[]>(
            [...PROJECT_CHATS_QUERY_KEY, pending.conversationId],
            (previous) =>
                previous?.map((chat) =>
                    chat.id === pending.chatId
                        ? {
                              ...chat,
                              reactions: apply_reaction_deltas(
                                  chat.reactions ?? [],
                                  pending.rollback,
                              ),
                          }
                        : chat,
                ),
        );
    }
}
