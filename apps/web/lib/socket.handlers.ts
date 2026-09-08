import type { QueryClient } from "@tanstack/react-query";
import {
    NotificationType,
    type OutboundSocketMessage,
    OutboundSocketMessageType,
} from "@trydarwin/types";

import { append_activities, update_agent_session } from "@/hooks/activity/useActivity";
import { rollbackPendingChatCreate } from "@/hooks/chats/chatCache";
import {
    CHAT_CONVERSATION_PREVIEWS_QUERY_KEY,
    mark_project_conversation_preview_deleted,
    mark_team_conversation_preview_deleted,
    update_project_conversation_preview,
    update_team_conversation_preview,
} from "@/hooks/chats/useChatConversationPreviews";
import { mark_chat_deleted, upsert_chat } from "@/hooks/chats/useChats";
import {
    reconcile_chat_reaction,
    reconcile_project_chat_reaction,
    reconcile_team_chat_reaction,
    rollback_reaction,
} from "@/hooks/chats/useMessageReactions";
import { mark_project_chat_deleted, upsert_project_chat } from "@/hooks/chats/useProjectChat";
import { mark_team_chat_deleted, upsert_team_chat } from "@/hooks/chats/useTeamChat";
import { append_darwin_events, seal_darwin_run } from "@/hooks/darwin/useDarwinThread";
import { updateBoardIssue, upsertBoardIssue } from "@/hooks/issues/useBoard";
import { issueAttemptsKey } from "@/hooks/issues/useIssueAttempts";
import { upsert_notification } from "@/hooks/notifications/notificationCache";
import { PROJECT_QUERY_KEY } from "@/hooks/project/useGetProject";
import { append_run_log_events, seal_run_log } from "@/hooks/runLogs/useRunLogs";
import { TEAM_MEMBERS_QUERY_KEY } from "@/hooks/team/useGetTeamMembers";
import { should_float_notification } from "@/lib/notifications/floatSuppression";
import SessionServices from "@/lib/session";
import { toast } from "@/lib/toast";
import { useCommandContextStore } from "@/store/command/useCommandContextStore";
import { useFloatNotificationsStore } from "@/store/playground/useFloatNotificationsStore";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

export class SocketHandlers {
    static handle_issue_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.ISSUE_CREATED) return;
        upsertBoardIssue(queryClient, message.projectId, message.payload);
    }

    static handle_issue_updated(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.ISSUE_UPDATED) return;
        updateBoardIssue(queryClient, message.projectId, message.payload, message.previous);
    }

    static handle_chat_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_CREATED) return;
        upsert_chat(queryClient, message.payload, message.operationId);
    }

    static handle_chat_deleted(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_DELETED) return;
        mark_chat_deleted(queryClient, message.payload);
    }

    static handle_chat_error(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_ERROR) return;
        if (message.operationId) {
            const rolledBackCreate = rollbackPendingChatCreate(queryClient, message.operationId);
            if (rolledBackCreate?.previewProjectId) {
                queryClient.invalidateQueries({
                    queryKey: [
                        ...CHAT_CONVERSATION_PREVIEWS_QUERY_KEY,
                        rolledBackCreate.previewProjectId,
                    ],
                });
            }
            rollback_reaction(message.operationId);
        }
        toast.error(message.message);
    }

    static handle_project_chat_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.PROJECT_CHAT_CREATED) return;
        upsert_project_chat(queryClient, message.payload, message.operationId);
        update_project_conversation_preview(queryClient, message.projectId, message.payload);
    }

    static handle_project_chat_deleted(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.PROJECT_CHAT_DELETED) return;
        mark_project_chat_deleted(queryClient, message.payload);
        mark_project_conversation_preview_deleted(
            queryClient,
            message.projectId,
            message.payload.id,
        );
    }

    static handle_team_chat_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.TEAM_CHAT_CREATED) return;
        upsert_team_chat(queryClient, message.payload, message.operationId);
        update_team_conversation_preview(queryClient, message.projectId, message.payload);
    }

    static handle_team_chat_deleted(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.TEAM_CHAT_DELETED) return;
        mark_team_chat_deleted(queryClient, message.payload);
        mark_team_conversation_preview_deleted(queryClient, message.projectId, message.payload);
    }

    static handle_chat_reaction_updated(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_REACTION_UPDATED) return;
        const currentUserId = SessionServices.get_user()?.id ?? undefined;
        const cached = queryClient.getQueryCache().findAll({ queryKey: ["chats"] });
        for (const query of cached) {
            const issueId = query.queryKey[1];
            if (typeof issueId === "string") {
                reconcile_chat_reaction(queryClient, issueId, message.payload, currentUserId);
            }
        }
    }

    static handle_project_chat_reaction_updated(
        queryClient: QueryClient,
        message: OutboundSocketMessage,
    ) {
        if (message.type !== OutboundSocketMessageType.PROJECT_CHAT_REACTION_UPDATED) return;
        reconcile_project_chat_reaction(
            queryClient,
            message.projectId,
            message.payload,
            SessionServices.get_user()?.id ?? undefined,
        );
    }

    static handle_team_chat_reaction_updated(
        queryClient: QueryClient,
        message: OutboundSocketMessage,
    ) {
        if (message.type !== OutboundSocketMessageType.TEAM_CHAT_REACTION_UPDATED) return;
        reconcile_team_chat_reaction(
            queryClient,
            message.teamId,
            message.payload,
            SessionServices.get_user()?.id ?? undefined,
        );
    }

    static handle_notification_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.NOTIFICATION_CREATED) return;
        upsert_notification(queryClient, message.payload);
        if (
            message.payload.type === NotificationType.AddedToTeam ||
            message.payload.type === NotificationType.RemovedFromTeam
        ) {
            queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY });
            const teamId = message.payload.payload.teamId;
            if (typeof teamId === "string") {
                queryClient.invalidateQueries({ queryKey: [...TEAM_MEMBERS_QUERY_KEY, teamId] });
            }
        }
        if (
            should_float_notification(
                message.payload,
                useNotificationsPanelStore.getState().isOpen,
                usePlaygroundNavStore.getState().tab,
                useCommandContextStore.getState().projectId,
            )
        ) {
            useFloatNotificationsStore.getState().push(message.payload);
        }
    }

    static handle_activity_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.ACTIVITY_CREATED) return;
        append_activities(queryClient, message.payload.issueId, message.payload.activities);
    }

    static handle_agent_session_updated(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.AGENT_SESSION_UPDATED) return;
        update_agent_session(queryClient, message.payload);
        queryClient.invalidateQueries({ queryKey: issueAttemptsKey(message.payload.issueId) });
    }

    static handle_run_log_appended(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.RUN_LOG_APPENDED) return;
        append_run_log_events(
            queryClient,
            message.runId,
            message.payload.events,
            message.payload.cursor,
        );
    }

    static handle_run_log_sealed(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.RUN_LOG_SEALED) return;
        seal_run_log(queryClient, message.runId, message.payload.droppedEvents);
    }

    static handle_darwin_run_appended(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.DARWIN_RUN_APPENDED) return;
        append_darwin_events(
            queryClient,
            message.runId,
            message.payload.events,
            message.payload.cursor,
        );
    }

    static handle_darwin_run_sealed(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.DARWIN_RUN_SEALED) return;
        seal_darwin_run(queryClient, message.runId, message.payload.status);
    }
}
