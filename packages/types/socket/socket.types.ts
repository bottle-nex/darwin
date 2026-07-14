import type { Chat, Issue } from "../prisma/schemas.prisma";

// Client -> Server
export enum InboundSocketMessageType {
    ISSUE_CREATE = "ISSUE_CREATE",
    CHAT_CREATE = "CHAT_CREATE",
}

export type InboundSocketMessage =
    | {
          type: InboundSocketMessageType.ISSUE_CREATE;
          projectId: string;
          payload: { title: string; description: string; assigneeIds?: string[] };
      }
    | {
          type: InboundSocketMessageType.CHAT_CREATE;
          payload: {
              issueId: string;
              message: string;
          };
      };

// Server -> Client
export enum OutboundSocketMessageType {
    ISSUE_CREATED = "ISSUE_CREATED",
    CHAT_CREATED = "CHAT_CREATED",
    CHAT_ERROR = "CHAT_ERROR",
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
      }
    | {
          type: OutboundSocketMessageType.CHAT_ERROR;
          message: string;
      };
