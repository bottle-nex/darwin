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
            [OutboundSocketMessageType.ISSUE_CREATED]: () =>
                SocketHandlers.handle_issue_created(queryClient, project_id),
            [OutboundSocketMessageType.CHAT_CREATED]: (message) =>
                SocketHandlers.handle_chat_created(queryClient, message),
            [OutboundSocketMessageType.CHAT_ERROR]: (message) =>
                SocketHandlers.handle_chat_error(message),
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
