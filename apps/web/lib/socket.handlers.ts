import type { QueryClient } from "@tanstack/react-query";
import { OutboundSocketMessageType, type OutboundSocketMessage } from "@trymatcha/types";
import { toast } from "sonner";
import { upsertBoardIssue } from "@/hooks/issues/useBoard";
import { upsert_chat, mark_chat_deleted } from "@/hooks/chats/useChats";
import { upsert_project_chat, mark_project_chat_deleted } from "@/hooks/chats/useProjectChat";

export class SocketHandlers {
    /** a new issue was created in the project -> merge it into the cached board directly. */
    static handle_issue_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.ISSUE_CREATED) return;
        upsertBoardIssue(queryClient, message.projectId, message.payload);
    }

    /** a new comment landed -> merge it into that issue's cached chat list. */
    static handle_chat_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_CREATED) return;
        upsert_chat(queryClient, message.payload);
    }

    /** a comment was deleted -> flag it (and quotes of it) in the cached chat list. */
    static handle_chat_deleted(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_DELETED) return;
        mark_chat_deleted(queryClient, message.payload);
    }

    /** the server rejected a comment we sent -> surface the reason. */
    static handle_chat_error(message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_ERROR) return;
        toast.error(message.message);
    }

    /** a new project-chat message landed -> merge it into that project's cached chat list. */
    static handle_project_chat_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.PROJECT_CHAT_CREATED) return;
        upsert_project_chat(queryClient, message.payload);
    }

    /** a project-chat message was deleted -> flag it (and quotes of it) in the cached list. */
    static handle_project_chat_deleted(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.PROJECT_CHAT_DELETED) return;
        mark_project_chat_deleted(queryClient, message.payload);
    }
}
