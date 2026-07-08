import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import SubscriberSystem from "./subscriber.system";
import { verifySessionJwt } from "../services/service.jwt";
import { InboundSocketMessageType, OutboundSocketMessageType, type InboundSocketMessage } from "@trymatcha/types";
import { IssueStatus, Prisma, prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../access-control/access";
import { server_services } from "..";
import type { AuthUser } from "../types/express.d";

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
        this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
            const { success, project_id, user } = this.validate_connection(req);
            if (!success || !user) {
                return ws.close(1008, "Invalid connection");
            }
            let connections = this.project_connections.get(project_id);
            if (!connections) {
                connections = new Set();
                this.project_connections.set(project_id, connections);
                this.subscriber_system.subscribe(project_id);
            }
            connections.add(ws);
            this.connection_users.set(ws, user);
            this.add_listeners(ws, project_id, user);
        });
    }

    private add_listeners(ws: WebSocket, project_id: string, user: AuthUser) {
        ws.on("message", async (raw: string) => {
            try {
                const message = JSON.parse(raw.toString()) as InboundSocketMessage;
                switch (message.type) {
                    case InboundSocketMessageType.ISSUE_CREATE:
                        await this.handle_issue_create(project_id, user, message.payload);
                        break;
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

    private async handle_issue_create(
        project_id: string,
        user: AuthUser,
        payload: { title: string; description: string; assigneeIds?: string[] },
    ) {
        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.create_issue)) {
            return;
        }

        let issue: { id: string; status: IssueStatus } | undefined;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                issue = await prisma.$transaction(async (tx) => {
                    const last_issue = await tx.issue.findFirst({
                        where: { projectId: project_id },
                        orderBy: { number: "desc" },
                        select: { number: true },
                    });
                    return tx.issue.create({
                        data: {
                            title: payload.title,
                            description: payload.description,
                            projectId: project_id,
                            createdById: user.id,
                            status: IssueStatus.Todo,
                            priority: 3,
                            number: (last_issue?.number ?? 0) + 1,
                        },
                        select: { id: true, status: true },
                    });
                });
                break;
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === "P2002"
                ) {
                    continue;
                }
                throw error;
            }
        }

        if (!issue) return;

        const full_issue = await prisma.issue.findUniqueOrThrow({
            where: { id: issue.id },
            include: { creator: true, assignees: true },
        });

        const channel_name = server_services.publisher.get_channel_name(project_id);
        const publishing_body = {
            type: OutboundSocketMessageType.ISSUE_CREATED,
            projectId: project_id,
            payload: full_issue,
        };
        await server_services.publisher.publish_message(channel_name, JSON.stringify(publishing_body));

        await server_services.queue.enqueue_project(project_id);
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
