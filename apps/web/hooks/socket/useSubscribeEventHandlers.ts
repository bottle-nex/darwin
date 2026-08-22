"use client";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OutboundSocketMessageType } from "@trymatcha/types";
import { SocketHandlers } from "@/lib/socket.handlers";
import { useWebSocket } from "./useWebSocket";
import type { MessageHandler } from "@/socket/socket.client";
import { reconcileBoardProject } from "@/hooks/issues/boardCache";

export function useSubscribeEventHandlers(project_id: string | undefined) {
    const { is_connected, subscribe, unsubscribe } = useWebSocket(project_id);
    const queryClient = useQueryClient();
    const wasConnected = useRef(false);

    useEffect(() => {
        if (!project_id) return;
        if (is_connected && !wasConnected.current) {
            reconcileBoardProject(queryClient, project_id);
        }
        wasConnected.current = is_connected;
    }, [is_connected, project_id, queryClient]);

    useEffect(() => {
        if (!project_id) return;
        const reconcileVisibleProject = () => {
            if (document.visibilityState === "visible") {
                reconcileBoardProject(queryClient, project_id);
            }
        };
        document.addEventListener("visibilitychange", reconcileVisibleProject);
        return () => document.removeEventListener("visibilitychange", reconcileVisibleProject);
    }, [project_id, queryClient]);

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
                SocketHandlers.handle_chat_error(queryClient, message),
            [OutboundSocketMessageType.PROJECT_CHAT_CREATED]: (message) =>
                SocketHandlers.handle_project_chat_created(queryClient, message),
            [OutboundSocketMessageType.PROJECT_CHAT_DELETED]: (message) =>
                SocketHandlers.handle_project_chat_deleted(queryClient, message),
            [OutboundSocketMessageType.PROJECT_CHAT_REACTION_UPDATED]: (message) =>
                SocketHandlers.handle_project_chat_reaction_updated(queryClient, message),
            [OutboundSocketMessageType.TEAM_CHAT_CREATED]: (message) =>
                SocketHandlers.handle_team_chat_created(queryClient, message),
            [OutboundSocketMessageType.TEAM_CHAT_DELETED]: (message) =>
                SocketHandlers.handle_team_chat_deleted(queryClient, message),
            [OutboundSocketMessageType.TEAM_CHAT_REACTION_UPDATED]: (message) =>
                SocketHandlers.handle_team_chat_reaction_updated(queryClient, message),
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
