"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OutboundSocketMessageType } from "@trymatcha/types";
import { SocketHandlers } from "@/lib/socket.handlers";
import { useWebSocket } from "./useWebSocket";
import type { MessageHandler } from "@/socket/socket.client";

export function useSubscribeEventHandlers(project_id: string | undefined) {
    const { subscribe, unsubscribe } = useWebSocket(project_id);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!project_id) return;

        const handlers_map: Record<OutboundSocketMessageType, MessageHandler> = {
            [OutboundSocketMessageType.ISSUE_CREATED]: (message) =>
                SocketHandlers.handle_issue_created(queryClient, message),
            [OutboundSocketMessageType.ISSUE_UPDATED]: (message) =>
                SocketHandlers.handle_issue_updated(queryClient, message),
            [OutboundSocketMessageType.CHAT_CREATED]: (message) =>
                SocketHandlers.handle_chat_created(queryClient, message),
            [OutboundSocketMessageType.CHAT_DELETED]: (message) =>
                SocketHandlers.handle_chat_deleted(queryClient, message),
            [OutboundSocketMessageType.CHAT_REACTION_UPDATED]: (message) =>
                SocketHandlers.handle_chat_reaction_updated(queryClient, message),
            [OutboundSocketMessageType.CHAT_ERROR]: (message) =>
                SocketHandlers.handle_chat_error(message),
            [OutboundSocketMessageType.PROJECT_CHAT_CREATED]: (message) =>
                SocketHandlers.handle_project_chat_created(queryClient, message),
            [OutboundSocketMessageType.PROJECT_CHAT_DELETED]: (message) =>
                SocketHandlers.handle_project_chat_deleted(queryClient, message),
            [OutboundSocketMessageType.PROJECT_CHAT_REACTION_UPDATED]: (message) =>
                SocketHandlers.handle_project_chat_reaction_updated(queryClient, message),
            [OutboundSocketMessageType.NOTIFICATION_CREATED]: (message) =>
                SocketHandlers.handle_notification_created(queryClient, message),
            [OutboundSocketMessageType.ACTIVITY_CREATED]: (message) =>
                SocketHandlers.handle_activity_created(queryClient, message),
            [OutboundSocketMessageType.AGENT_SESSION_UPDATED]: (message) =>
                SocketHandlers.handle_agent_session_updated(queryClient, message),
        };

        Object.entries(handlers_map).forEach(([type, handler]) => {
            subscribe(type as OutboundSocketMessageType, handler);
        });

        return () => {
            Object.entries(handlers_map).forEach(([type, handler]) => {
                unsubscribe(type as OutboundSocketMessageType, handler);
            });
        };
    }, [subscribe, unsubscribe, queryClient, project_id]);
}
