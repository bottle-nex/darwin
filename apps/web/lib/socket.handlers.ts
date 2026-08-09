import type { QueryClient } from "@tanstack/react-query";
import { OutboundSocketMessageType, type OutboundSocketMessage } from "@trymatcha/types";
import { toast } from "sonner";
import { upsertBoardIssue } from "@/hooks/issues/useBoard";
import { upsert_chat, mark_chat_deleted } from "@/hooks/chats/useChats";
import { upsert_project_chat, mark_project_chat_deleted } from "@/hooks/chats/useProjectChat";
import { upsert_notification } from "@/hooks/notifications/useNotifications";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { useFloatNotificationsStore } from "@/store/playground/useFloatNotificationsStore";

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

    static handle_notification_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.NOTIFICATION_CREATED) return;
        upsert_notification(queryClient, message.payload);
        if (!useNotificationsPanelStore.getState().isOpen) {
            useFloatNotificationsStore.getState().push(message.payload);
        }
    }
}
