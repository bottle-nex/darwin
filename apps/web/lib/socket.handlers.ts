import type { QueryClient } from "@tanstack/react-query";
import { OutboundSocketMessageType, type OutboundSocketMessage } from "@trymatcha/types";
import { toast } from "sonner";
import { upsertBoardIssue } from "@/hooks/issues/useBoard";
import { upsert_chat, mark_chat_deleted } from "@/hooks/chats/useChats";
import { upsert_project_chat, mark_project_chat_deleted } from "@/hooks/chats/useProjectChat";
import { upsert_notification } from "@/hooks/notifications/useNotifications";

export class SocketHandlers {
    static handle_issue_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.ISSUE_CREATED) return;
        upsertBoardIssue(queryClient, message.projectId, message.payload);
    }

    static handle_chat_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_CREATED) return;
        upsert_chat(queryClient, message.payload);
    }

    static handle_chat_deleted(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_DELETED) return;
        mark_chat_deleted(queryClient, message.payload);
    }

    static handle_chat_error(message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_ERROR) return;
        toast.error(message.message);
    }

    static handle_project_chat_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.PROJECT_CHAT_CREATED) return;
        upsert_project_chat(queryClient, message.payload);
    }

    static handle_project_chat_deleted(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.PROJECT_CHAT_DELETED) return;
        mark_project_chat_deleted(queryClient, message.payload);
    }

    /**
     * A notification was pushed on the project channel -> merge it into the cache, but only
     * if it's addressed to the current user. Delivery reuses the project-wide pubsub channel
     * (same as chat), so every connected member's socket receives every member's
     * notifications; the client is what scopes it down to "mine".
     */
    static handle_notification_created(
        queryClient: QueryClient,
        message: OutboundSocketMessage,
        current_user_id: string | undefined,
    ) {
        if (message.type !== OutboundSocketMessageType.NOTIFICATION_CREATED) return;
        if (!current_user_id || message.payload.userId !== current_user_id) return;
        upsert_notification(queryClient, message.payload);
    }
}
