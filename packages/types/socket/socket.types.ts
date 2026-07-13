import type { Chat, Issue } from "../prisma/schemas.prisma";

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
    CHAT_CREATED = "CHAT_CREATED",
}

export type OutboundSocketMessage =
    | {
          type: OutboundSocketMessageType.ISSUE_CREATED;
          projectId: string;
          payload: Issue;
      }
    | {
          type: OutboundSocketMessageType.CHAT_CREATED;
          projectId: string;
          payload: Chat;
      };
