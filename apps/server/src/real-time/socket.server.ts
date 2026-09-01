import { Action, Permissions } from "@trymatcha/access-control";
import { SubscriberSystem } from "@trymatcha/services";
import {
    AppSocketCloseCode,
    type InboundSocketMessage,
    InboundSocketMessageType,
    StandardSocketCloseCode,
} from "@trymatcha/types";
import type { IncomingMessage, Server } from "http";
import { type RawData, WebSocket, WebSocketServer } from "ws";

import Access from "../access-control/access";
import { verifySessionJwt } from "../services/service.jwt";
import PresenceService from "../services/service.presence";
import type { AuthUser } from "../types/express.d";
import ChatSocketHandler from "./chat.handler";
import ProjectChatSocketHandler from "./project-chat.handler";
import RunLogSocketHandler from "./run-log.handler";
import TeamChatSocketHandler from "./team-chat.handler";

const PRESENCE_HEARTBEAT_MS = 30_000;

export default class SocketServer {
    private wss: WebSocketServer;
    private project_connections: Map<string, Set<WebSocket>> = new Map();
    private user_connections: Map<string, Set<WebSocket>> = new Map();
    private connection_users: Map<WebSocket, AuthUser> = new Map();
    private run_connections: Map<string, Set<WebSocket>> = new Map();
    private connection_runs: Map<WebSocket, Set<string>> = new Map();
    private subscriber_system: SubscriberSystem;

    constructor(server: Server) {
        this.wss = new WebSocketServer({ server });
        this.subscriber_system = new SubscriberSystem();
        this.init_connection();
        this.start_listening();
        this.start_presence_heartbeat();
    }

    private start_presence_heartbeat() {
        const timer = setInterval(() => {
            PresenceService.refresh([...this.user_connections.keys()]).catch((error) => {
                console.error("Presence heartbeat failed:", error);
            });
        }, PRESENCE_HEARTBEAT_MS);
        timer.unref();
    }

    private start_listening() {
        this.subscriber_system.on_message((channel, message) => {
            if (channel.scope !== "project") return this.send_to_user(channel.id, message);

            const run_id = RunLogSocketHandler.target_run(message);
            if (run_id) return this.send_to_run(run_id, message);
            this.broadcast_message(channel.id, message);
        });
    }

    private init_connection() {
        this.wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
            const pending_messages: RawData[] = [];
            const queue_message = (raw: RawData) => {
                if (pending_messages.length >= 100) {
                    ws.close(StandardSocketCloseCode.POLICY_VIOLATION, "Too many pending messages");
                    return;
                }
                pending_messages.push(raw);
            };
            ws.on("message", queue_message);

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
            if (ws.readyState !== WebSocket.OPEN) return;
            let connections = this.project_connections.get(project_id);
            if (!connections) {
                connections = new Set();
                this.project_connections.set(project_id, connections);
                this.subscriber_system.subscribe_project(project_id);
            }
            connections.add(ws);

            let user_sockets = this.user_connections.get(user.id);
            if (!user_sockets) {
                user_sockets = new Set();
                this.user_connections.set(user.id, user_sockets);
                this.subscriber_system.subscribe_user(user.id);
            }
            user_sockets.add(ws);
            PresenceService.mark_online(user.id).catch((error) => {
                console.error("Presence mark_online failed:", error);
            });

            this.connection_users.set(ws, user);
            ws.off("message", queue_message);
            this.add_listeners(ws, project_id);
            for (const raw of pending_messages) await this.handle_message(ws, project_id, raw);
        });
    }

    private add_listeners(ws: WebSocket, project_id: string) {
        ws.on("message", (raw) => void this.handle_message(ws, project_id, raw));
        ws.on("close", (message: string) => {
            console.log(`Connection closed: ${message}`);
            this.remove_connection(ws, project_id);
        });
        ws.on("error", (error: Error) => {
            console.error(`Connection error: ${error.message}`);
        });
    }

    private async handle_message(ws: WebSocket, project_id: string, raw: RawData) {
        try {
            const message = JSON.parse(raw.toString()) as InboundSocketMessage;
            switch (message.type) {
                case InboundSocketMessageType.CHAT_CREATE:
                    await this.create_chat(ws, project_id, message);
                    return;
                case InboundSocketMessageType.CHAT_DELETE:
                    await this.delete_chat(ws, project_id, message);
                    return;
                case InboundSocketMessageType.CHAT_REACTION_TOGGLE:
                    await this.toggle_chat_reaction(ws, project_id, message);
                    return;
                case InboundSocketMessageType.PROJECT_CHAT_CREATE:
                    await this.create_project_chat(ws, project_id, message);
                    return;
                case InboundSocketMessageType.PROJECT_CHAT_DELETE:
                    await this.delete_project_chat(ws, project_id, message);
                    return;
                case InboundSocketMessageType.PROJECT_CHAT_REACTION_TOGGLE:
                    await this.toggle_project_chat_reaction(ws, project_id, message);
                    return;
                case InboundSocketMessageType.TEAM_CHAT_CREATE:
                    await this.create_team_chat(ws, project_id, message);
                    return;
                case InboundSocketMessageType.TEAM_CHAT_DELETE:
                    await this.delete_team_chat(ws, project_id, message);
                    return;
                case InboundSocketMessageType.TEAM_CHAT_REACTION_TOGGLE:
                    await this.toggle_team_chat_reaction(ws, project_id, message);
                    return;
                case InboundSocketMessageType.RUN_LOG_SUBSCRIBE:
                    await this.subscribe_run_logs(ws, project_id, message.payload.runId);
                    return;
                case InboundSocketMessageType.RUN_LOG_UNSUBSCRIBE:
                    this.unsubscribe_run_logs(ws, message.payload.runId);
                    return;
            }
        } catch (error) {
            console.error("Socket message handler error:", error);
        }
    }

    private async subscribe_run_logs(ws: WebSocket, project_id: string, run_id: string) {
        if (this.connection_runs.get(ws)?.has(run_id)) return;
        if (!(await RunLogSocketHandler.belongs_to_project(run_id, project_id))) return;
        if (ws.readyState !== WebSocket.OPEN) return;

        let subscribers = this.run_connections.get(run_id);
        if (!subscribers) {
            subscribers = new Set();
            this.run_connections.set(run_id, subscribers);
        }
        subscribers.add(ws);

        let runs = this.connection_runs.get(ws);
        if (!runs) {
            runs = new Set();
            this.connection_runs.set(ws, runs);
        }
        runs.add(run_id);
    }

    private unsubscribe_run_logs(ws: WebSocket, run_id: string) {
        const subscribers = this.run_connections.get(run_id);
        if (subscribers) {
            subscribers.delete(ws);
            if (subscribers.size === 0) this.run_connections.delete(run_id);
        }

        const runs = this.connection_runs.get(ws);
        if (!runs) return;
        runs.delete(run_id);
        if (runs.size === 0) this.connection_runs.delete(ws);
    }

    private send_to_run(run_id: string, message: string) {
        const subscribers = this.run_connections.get(run_id);
        if (!subscribers) return;
        for (const ws of subscribers) {
            if (ws.readyState === WebSocket.OPEN) ws.send(message);
        }
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

    private send_to_user(user_id: string, message: string) {
        const connections = this.user_connections.get(user_id);
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

    private async toggle_chat_reaction(
        ws: WebSocket,
        project_id: string,
        message: InboundSocketMessage,
    ) {
        const user = this.connection_users.get(ws);
        if (!user) return;
        await ChatSocketHandler.handle_chat_reaction(ws, user, project_id, message.payload);
    }

    private async toggle_project_chat_reaction(
        ws: WebSocket,
        project_id: string,
        message: InboundSocketMessage,
    ) {
        const user = this.connection_users.get(ws);
        if (!user) return;
        await ProjectChatSocketHandler.handle_project_chat_reaction(
            ws,
            user,
            project_id,
            message.payload,
        );
    }

    private async toggle_team_chat_reaction(
        ws: WebSocket,
        project_id: string,
        message: InboundSocketMessage,
    ) {
        const user = this.connection_users.get(ws);
        if (!user) return;
        await TeamChatSocketHandler.handle_team_chat_reaction(
            ws,
            user,
            project_id,
            message.payload,
        );
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

    private async create_team_chat(
        ws: WebSocket,
        project_id: string,
        message: InboundSocketMessage,
    ) {
        const user = this.connection_users.get(ws);
        if (!user) return;
        await TeamChatSocketHandler.handle_team_chat_create(ws, user, project_id, message.payload);
    }

    private async delete_team_chat(
        ws: WebSocket,
        project_id: string,
        message: InboundSocketMessage,
    ) {
        const user = this.connection_users.get(ws);
        if (!user) return;
        await TeamChatSocketHandler.handle_team_chat_delete(ws, user, project_id, message.payload);
    }

    private remove_connection(ws: WebSocket, project_id: string) {
        const user = this.connection_users.get(ws);
        this.connection_users.delete(ws);

        for (const run_id of this.connection_runs.get(ws) ?? []) {
            const subscribers = this.run_connections.get(run_id);
            subscribers?.delete(ws);
            if (subscribers && subscribers.size === 0) this.run_connections.delete(run_id);
        }
        this.connection_runs.delete(ws);

        const connections = this.project_connections.get(project_id);
        if (connections) {
            connections.delete(ws);
            if (connections.size === 0) {
                this.project_connections.delete(project_id);
                this.subscriber_system.unsubscribe_project(project_id);
            }
        }

        if (!user) return;
        const user_sockets = this.user_connections.get(user.id);
        if (user_sockets) {
            user_sockets.delete(ws);
            if (user_sockets.size === 0) {
                this.user_connections.delete(user.id);
                this.subscriber_system.unsubscribe_user(user.id);
                PresenceService.mark_offline(user.id).catch((error) => {
                    console.error("Presence mark_offline failed:", error);
                });
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
