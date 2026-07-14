import type { InboundSocketMessage } from "@trymatcha/types";
import WebSocketClient from "./socket.client";

const WS_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/^https?/, (m) =>
    m === "https" ? "wss" : "ws",
);

let client: WebSocketClient | null = null;
let active_project_id: string | null = null;

export function get_socket_client(project_id: string, token: string): WebSocketClient {
    if (client && active_project_id === project_id) {
        return client;
    }
    if (client) {
        client.close();
    }
    active_project_id = project_id;
    client = new WebSocketClient(`${WS_BASE}?projectId=${project_id}&token=${token}`);
    return client;
}

/**
 * Send through the active project connection. Returns false when no connection
 * has been opened yet; if the socket is mid-reconnect the client queues the
 * message and flushes it once reconnected.
 */
export function send_socket_message(message: InboundSocketMessage): boolean {
    if (!client) return false;
    client.send(message);
    return true;
}

export function close_socket_client(): void {
    if (client) {
        client.close();
        client = null;
        active_project_id = null;
    }
}
