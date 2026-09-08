"use client";
import { useQueryClient } from "@tanstack/react-query";
import {
    type Chat,
    InboundSocketMessageType,
    type LabelledReference,
    ProjectRole,
} from "@trydarwin/types";
import { useMemo } from "react";

import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { send_socket_message } from "@/hooks/socket/useWebSocket";
import { useActiveProject } from "@/hooks/useActiveProject";
import SessionServices from "@/lib/session";
import { toast } from "@/lib/toast";

import { flattenChatPages } from "./chatCache";
import {
    add_chat,
    build_optimistic_chat,
    mark_chat_deleted,
    OPTIMISTIC_ID_PREFIX,
    useChats,
} from "./useChats";
import { toggle_chat_reaction } from "./useMessageReactions";

export function useIssueComments(issueId: string | undefined) {
    const queryClient = useQueryClient();
    const history = useChats(issueId);
    const comments = useMemo(
        () => (history.data ? flattenChatPages(history.data.pages) : undefined),
        [history.data],
    );
    const projectId = useActiveProject()?.id;
    const { data: members } = useProjectMembers(projectId);
    const viewerId = SessionServices.get_user()?.id;
    const viewerIsAdmin =
        members?.some((member) => member.id === viewerId && member.role === ProjectRole.Admin) ??
        false;

    function send(message: string, references: LabelledReference[], repliedToId?: string) {
        if (!issueId) return;
        const operationId = crypto.randomUUID();
        const sent = send_socket_message({
            type: InboundSocketMessageType.CHAT_CREATE,
            payload: { issueId, message, repliedToId, operationId },
        });
        if (!sent) {
            toast.error("Couldn't add your comment.");
            return;
        }

        const viewer = SessionServices.get_user();
        if (!viewer?.id || !viewer.email) return;
        const repliedTo = repliedToId
            ? (comments?.find((comment) => comment.id === repliedToId) ?? null)
            : null;
        add_chat(
            queryClient,
            build_optimistic_chat(issueId, operationId, message, references, repliedTo, {
                id: viewer.id,
                name: viewer.name ?? null,
                email: viewer.email,
                image: viewer.image ?? null,
            }),
            () => toast.error("Couldn't confirm your comment. Try sending it again."),
        );
    }

    function remove(comment: Chat) {
        const sent = send_socket_message({
            type: InboundSocketMessageType.CHAT_DELETE,
            payload: { chatId: comment.id },
        });
        if (!sent) {
            toast.error("Couldn't delete the comment.");
            return;
        }
        mark_chat_deleted(queryClient, comment);
    }

    function react(comment: Chat, emoji: string) {
        if (comment.id.startsWith(OPTIMISTIC_ID_PREFIX)) return;
        if (!toggle_chat_reaction(queryClient, comment, emoji)) {
            toast.error("Couldn't update the reaction.");
        }
    }

    function canDelete(comment: Chat) {
        return (
            Boolean(viewerId) &&
            !comment.id.startsWith(OPTIMISTIC_ID_PREFIX) &&
            !comment.isDeleted &&
            (comment.senderId === viewerId || viewerIsAdmin)
        );
    }

    return {
        comments,
        pages: history.data,
        isLoading: history.isLoading,
        isInitialError: history.isError && !history.data,
        isPageError: history.isFetchNextPageError,
        isFetchingOlder: history.isFetchingNextPage,
        hasOlder: Boolean(history.hasNextPage),
        fetchOlder: history.fetchNextPage,
        retry: history.refetch,
        projectId,
        viewerId,
        send,
        remove,
        react,
        canDelete,
    };
}
