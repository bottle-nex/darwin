"use client";
import { useEffect, useRef, useState } from "react";
import WebSocketClient from "@/socket/socket.client";
import { get_socket_client, close_socket_client } from "@/socket/singleton.socket";
import { type MessageHandler } from "@/socket/socket.client";
import { InboundSocketMessageType, OutboundSocketMessageType } from "@trymatcha/types";
import SessionServices from "@/lib/session";

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
        socket.current.set_connection_state_handler(set_is_connected);
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

    function send_issue_create(payload: {
        title: string;
        description: string;
        assigneeIds?: string[];
    }) {
        if (!project_id || !socket.current) return;
        socket.current.send({
            type: InboundSocketMessageType.ISSUE_CREATE,
            projectId: project_id,
            payload,
        });
    }

    return {
        is_connected,
        subscribe,
        unsubscribe,
        send_issue_create,
    };
}
