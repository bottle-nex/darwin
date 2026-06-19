import type { Issue } from "../prisma/schemas.prisma";

// Client -> Server
export enum InboundSocketMessageType {
    ISSUE_CREATE = "ISSUE_CREATE",
}

export type InboundSocketMessage = {
    type: InboundSocketMessageType.ISSUE_CREATE;
    projectId: string;
    payload: { title: string; description: string; assigneeIds?: string[] };
};

// Server -> Client
export enum OutboundSocketMessageType {
    ISSUE_CREATED = "ISSUE_CREATED",
}

export type OutboundSocketMessage = {
    type: OutboundSocketMessageType.ISSUE_CREATED;
    projectId: string;
    payload: Issue;
};
