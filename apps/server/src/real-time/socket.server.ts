import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import SubscriberSystem from "./subscriber.server";
import { verifySessionJwt } from "../services/service.jwt";
import { InboundSocketMessageType, type InboundSocketMessage } from "@trymatcha/types";

export default class SocketServer {
    private wss: WebSocketServer;
    private project_connections: Map<string, Set<WebSocket>> = new Map();
    private subscriber_system: SubscriberSystem;

    constructor(server: Server) {
        this.wss = new WebSocketServer({ server });
        this.subscriber_system = new SubscriberSystem();
        this.init_connection();
        this.start_listening();
    }

    private start_listening() {
        this.subscriber_system.redis.on("message", (channel: string, message: string) => {
            const project_id = channel.split(":")[1];
            this.broadcast_message(project_id, message);
        });
    }

    private init_connection() {
        this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
            const { success, project_id } = this.validate_connection(req);
            if (!success) {
                return ws.close(1008, "Invalid connection");
            }
            let connections = this.project_connections.get(project_id);
            if (!connections) {
                connections = new Set();
                this.project_connections.set(project_id, connections);
                this.subscriber_system.redis.subscribe(`project:${project_id}`);
            }
            connections.add(ws);
            this.add_listeners(ws, project_id);
        });
    }

    private add_listeners(ws: WebSocket, project_id: string) {
        ws.on("message", (raw: string) => {
            const message = JSON.parse(raw.toString()) as InboundSocketMessage;
            switch (message.type) {
                case InboundSocketMessageType.ISSUE_CREATE:
                    break;
            }
        });
        ws.on("close", (message: string) => {
            console.log(`Connection closed: ${message}`);
            this.remove_connection(ws, project_id);
        });
        ws.on("error", (error: Error) => {
            console.error(`Connection error: ${error.message}`);
        });
    }

    private broadcast_message(project_id: string, message: string) {
        const connections = this.project_connections.get(project_id);
        if (connections) {
            for (const ws of connections) {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(message);
                }
            }
        }
    }

    private remove_connection(ws: WebSocket, project_id: string) {
        const connections = this.project_connections.get(project_id);
        if (connections) {
            connections.delete(ws);
            if (connections.size === 0) {
                this.project_connections.delete(project_id);
                this.subscriber_system.redis.unsubscribe(`project:${project_id}`);
            }
        }
    }

    private validate_connection(req: IncomingMessage): { success: boolean; project_id: string } {
        try {
            if (!req.url) {
                return { success: false, project_id: "" };
            }

            const base = `http://${req.headers.host ?? "localhost"}`;
            const { searchParams } = new URL(req.url, base);

            const project_id = searchParams.get("projectId");
            const token = searchParams.get("token");
            if (!project_id || !token) {
                return { success: false, project_id: "" };
            }

            verifySessionJwt(token);

            return { success: true, project_id };
        } catch {
            return { success: false, project_id: "" };
        }
    }
}
