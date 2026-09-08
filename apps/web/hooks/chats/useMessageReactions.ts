import type { QueryClient } from "@tanstack/react-query";
import {
    apply_reaction_deltas,
    apply_reaction_updates,
    type Chat,
    get_reaction_selection,
    InboundSocketMessageType,
    type ProjectChat,
    type ReactionDelta,
    type ReactionSummary,
    type TeamChat,
} from "@trydarwin/types";
import { useSyncExternalStore } from "react";

import { send_socket_message } from "@/hooks/socket/useWebSocket";

import { updateChatReactions } from "./chatCache";

type ReactionEvent = {
    chatId: string;
    updates: { emoji: string; count: number; actorReacted: boolean }[];
    actorId: string;
    operationId: string;
};

type PendingReaction = {
    queryClient: QueryClient;
    kind: "chat" | "project" | "team";
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
    updateChatReactions<Chat>(queryClient, "issue", issueId, chatId, () => reactions);
}

function set_project_chat_reactions(
    queryClient: QueryClient,
    projectId: string,
    chatId: string,
    reactions: ReactionSummary[],
) {
    updateChatReactions<ProjectChat>(queryClient, "project", projectId, chatId, () => reactions);
}

function set_team_chat_reactions(
    queryClient: QueryClient,
    teamId: string,
    chatId: string,
    reactions: ReactionSummary[],
) {
    updateChatReactions<TeamChat>(queryClient, "team", teamId, chatId, () => reactions);
}

function set_reactions(pending: PendingReaction, reactions: ReactionSummary[]) {
    if (pending.kind === "chat") {
        set_chat_reactions(pending.queryClient, pending.conversationId, pending.chatId, reactions);
    } else if (pending.kind === "project") {
        set_project_chat_reactions(
            pending.queryClient,
            pending.conversationId,
            pending.chatId,
            reactions,
        );
    } else {
        set_team_chat_reactions(
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
    chat: Chat | ProjectChat | TeamChat,
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

export function toggle_team_chat_reaction(queryClient: QueryClient, chat: TeamChat, emoji: string) {
    const operationId = optimistic_toggle(queryClient, "team", chat.teamId, chat, emoji);
    if (!operationId) return false;
    const sent = send_socket_message({
        type: InboundSocketMessageType.TEAM_CHAT_REACTION_TOGGLE,
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
    updateChatReactions<Chat>(queryClient, "issue", issueId, event.chatId, (existing) =>
        apply_reaction_updates(
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
    );
    settle_reaction(event.operationId);
}

export function reconcile_project_chat_reaction(
    queryClient: QueryClient,
    projectId: string,
    event: ReactionEvent,
    viewerId?: string,
) {
    updateChatReactions<ProjectChat>(queryClient, "project", projectId, event.chatId, (existing) =>
        apply_reaction_updates(
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
    );
    settle_reaction(event.operationId);
}

export function reconcile_team_chat_reaction(
    queryClient: QueryClient,
    teamId: string,
    event: ReactionEvent,
    viewerId?: string,
) {
    updateChatReactions<TeamChat>(queryClient, "team", teamId, event.chatId, (existing) =>
        apply_reaction_updates(
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
    );
    settle_reaction(event.operationId);
}

export function rollback_reaction(operationId: string) {
    const pending = settle_reaction(operationId);
    if (!pending) return;
    if (pending.kind === "chat") {
        updateChatReactions<Chat>(
            pending.queryClient,
            "issue",
            pending.conversationId,
            pending.chatId,
            (reactions) => apply_reaction_deltas(reactions, pending.rollback),
        );
    } else if (pending.kind === "project") {
        updateChatReactions<ProjectChat>(
            pending.queryClient,
            "project",
            pending.conversationId,
            pending.chatId,
            (reactions) => apply_reaction_deltas(reactions, pending.rollback),
        );
    } else {
        updateChatReactions<TeamChat>(
            pending.queryClient,
            "team",
            pending.conversationId,
            pending.chatId,
            (reactions) => apply_reaction_deltas(reactions, pending.rollback),
        );
    }
}
