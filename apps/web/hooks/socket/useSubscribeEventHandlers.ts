"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OutboundSocketMessageType } from "@trymatcha/types";
import { SocketHandlers } from "@/lib/socket.handlers";
import { useWebSocket } from "./useWebSocket";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { MessageHandler } from "@/socket/socket.client";

export function useSubscribeEventHandlers(project_id: string | undefined) {
    const { subscribe, unsubscribe } = useWebSocket(project_id);
    const queryClient = useQueryClient();
    const current_user_id = useUserSessionStore((s) => s.session?.user?.id ?? undefined);

    useEffect(() => {
        if (!project_id) return;

        const handlers_map: Record<OutboundSocketMessageType, MessageHandler> = {
            [OutboundSocketMessageType.ISSUE_CREATED]: (message) =>
                SocketHandlers.handle_issue_created(queryClient, message),
            [OutboundSocketMessageType.CHAT_CREATED]: (message) =>
                SocketHandlers.handle_chat_created(queryClient, message),
            [OutboundSocketMessageType.CHAT_DELETED]: (message) =>
                SocketHandlers.handle_chat_deleted(queryClient, message),
            [OutboundSocketMessageType.CHAT_ERROR]: (message) =>
                SocketHandlers.handle_chat_error(message),
            [OutboundSocketMessageType.PROJECT_CHAT_CREATED]: (message) =>
                SocketHandlers.handle_project_chat_created(queryClient, message),
            [OutboundSocketMessageType.PROJECT_CHAT_DELETED]: (message) =>
                SocketHandlers.handle_project_chat_deleted(queryClient, message),
            [OutboundSocketMessageType.NOTIFICATION_CREATED]: (message) =>
                SocketHandlers.handle_notification_created(queryClient, message, current_user_id),
        };

        Object.entries(handlers_map).forEach(([type, handler]) => {
            subscribe(type as OutboundSocketMessageType, handler);
        });

        return () => {
            Object.entries(handlers_map).forEach(([type, handler]) => {
                unsubscribe(type as OutboundSocketMessageType, handler);
            });
        };
    }, [subscribe, unsubscribe, queryClient, project_id, current_user_id]);
}
