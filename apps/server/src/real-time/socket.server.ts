import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import SubscriberSystem from "./subscriber.system";
import { verifySessionJwt } from "../services/service.jwt";
import {
    AppSocketCloseCode,
    InboundSocketMessageType,
    StandardSocketCloseCode,
    type InboundSocketMessage,
} from "@trymatcha/types";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../access-control/access";
import type { AuthUser } from "../types/express.d";
import ChatSocketHandler from "./chat.handler";
import ProjectChatSocketHandler from "./project-chat.handler";

export default class SocketServer {
    private wss: WebSocketServer;
    private project_connections: Map<string, Set<WebSocket>> = new Map();
    private connection_users: Map<WebSocket, AuthUser> = new Map();
    private subscriber_system: SubscriberSystem;

    constructor(server: Server) {
        this.wss = new WebSocketServer({ server });
        this.subscriber_system = new SubscriberSystem();
        this.init_connection();
        this.start_listening();
    }

    private start_listening() {
        this.subscriber_system.on_message((project_id, message) => {
            this.broadcast_message(project_id, message);
        });
    }

    private init_connection() {
        this.wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
            const { success, project_id, user } = this.validate_connection(req);
            if (!success || !user) {
                return ws.close(AppSocketCloseCode.UNAUTHORIZED, "Invalid connection");
            }
            try {
                const role = await Access.project(user.id, project_id);
                if (!role || !Permissions.project(role, Action.project.read)) {
                    return ws.close(
                        AppSocketCloseCode.INVALID_PROJECT,
                        "You dont have access to this project",
                    );
                }
            } catch (error) {
                console.error("Socket connection access check error:", error);
                return ws.close(StandardSocketCloseCode.INTERNAL_ERROR, "Something went wrong");
            }
            let connections = this.project_connections.get(project_id);
            if (!connections) {
                connections = new Set();
                this.project_connections.set(project_id, connections);
                this.subscriber_system.subscribe(project_id);
            }
            connections.add(ws);
            this.connection_users.set(ws, user);
            this.add_listeners(ws, project_id);
        });
    }

    private add_listeners(ws: WebSocket, project_id: string) {
        ws.on("message", async (raw: string) => {
            try {
                const message = JSON.parse(raw.toString()) as InboundSocketMessage;
                switch (message.type) {
                    case InboundSocketMessageType.CHAT_CREATE:
                        await this.create_chat(ws, project_id, message);
                        return;
                    case InboundSocketMessageType.CHAT_DELETE:
                        await this.delete_chat(ws, project_id, message);
                        return;
                    case InboundSocketMessageType.PROJECT_CHAT_CREATE:
                        await this.create_project_chat(ws, project_id, message);
                        return;
                    case InboundSocketMessageType.PROJECT_CHAT_DELETE:
                        await this.delete_project_chat(ws, project_id, message);
                        return;
                    default:
                        return;
                }
            } catch (error) {
                console.error("Socket message handler error:", error);
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

    private async delete_chat(ws: WebSocket, project_id: string, message: InboundSocketMessage) {
        const user = this.connection_users.get(ws);
        if (!user) return;
        await ChatSocketHandler.handle_chat_delete(ws, user, project_id, message.payload);
        return;
    }

    private async delete_project_chat(
        ws: WebSocket,
        project_id: string,
        message: InboundSocketMessage,
    ) {
        const user = this.connection_users.get(ws);
        if (!user) return;
        await ProjectChatSocketHandler.handle_project_chat_delete(
            ws,
            user,
            project_id,
            message.payload,
        );
        return;
    }

    private async create_chat(ws: WebSocket, project_id: string, message: InboundSocketMessage) {
        const user = this.connection_users.get(ws);
        if (!user) return;
        await ChatSocketHandler.handle_chat_create(ws, user, project_id, message.payload);
        return;
    }

    private async create_project_chat(
        ws: WebSocket,
        project_id: string,
        message: InboundSocketMessage,
    ) {
        const user = this.connection_users.get(ws);
        if (!user) return;
        await ProjectChatSocketHandler.handle_project_chat_create(
            ws,
            user,
            project_id,
            message.payload,
        );
        return;
    }

    private remove_connection(ws: WebSocket, project_id: string) {
        this.connection_users.delete(ws);
        const connections = this.project_connections.get(project_id);
        if (connections) {
            connections.delete(ws);
            if (connections.size === 0) {
                this.project_connections.delete(project_id);
                this.subscriber_system.unsubscribe(project_id);
            }
        }
    }

    private validate_connection(req: IncomingMessage): {
        success: boolean;
        project_id: string;
        user?: AuthUser;
    } {
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

            const user = verifySessionJwt(token);

            return { success: true, project_id, user };
        } catch {
            return { success: false, project_id: "" };
        }
    }
}
