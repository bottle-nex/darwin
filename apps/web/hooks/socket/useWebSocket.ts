"use client";
import type { InboundSocketMessage, OutboundSocketMessageType } from "@trydarwin/types";
import { useEffect, useRef, useState } from "react";

import SessionServices from "@/lib/session";
import {
    close_socket_client,
    get_active_socket_client,
    get_socket_client,
} from "@/socket/singleton.socket";
import { type default as WebSocketClient, type MessageHandler } from "@/socket/socket.client";

/**
 * Send through the active project connection. Returns false when no connection
 * has been opened yet; if the socket is mid-reconnect the client queues the
 * message and flushes it once reconnected.
 */
export function send_socket_message(message: InboundSocketMessage): boolean {
    const client = get_active_socket_client();
    if (!client) return false;
    client.send(message);
    return true;
}

export function useWebSocket(project_id: string | undefined) {
    const socket = useRef<WebSocketClient | null>(null);
    const last_project_id = useRef<string | null>(null);
    const [is_connected, set_is_connected] = useState(false);

    useEffect(() => {
        const token = SessionServices.get_token();
        if (!project_id || !token) return;
        if (last_project_id.current === project_id) return;

        last_project_id.current = project_id;
        socket.current = get_socket_client(project_id, token);
        socket.current.add_connection_state_handler(set_is_connected);
        set_is_connected(socket.current.is_connected);

        return () => {
            if (last_project_id.current !== project_id) {
                close_socket_client();
                socket.current = null;
                set_is_connected(false);
            }
        };
    }, [project_id]);

    function subscribe(type: OutboundSocketMessageType, handler: MessageHandler) {
        if (!socket.current) {
            console.warn("useWebSocket: subscribe called with no active connection");
            return;
        }
        socket.current.subscribe(type, handler);
    }

    function unsubscribe(type: OutboundSocketMessageType, handler: MessageHandler) {
        if (!socket.current) return;
        socket.current.unsubscribe(type, handler);
    }

    return {
        is_connected,
        subscribe,
        unsubscribe,
    };
}
