import type { Chat, Issue, Notification, ProjectChat } from "../prisma/schemas.prisma";

// Client -> Server
export enum InboundSocketMessageType {
    ISSUE_CREATE = "ISSUE_CREATE",
    CHAT_CREATE = "CHAT_CREATE",
    CHAT_DELETE = "CHAT_DELETE",
    PROJECT_CHAT_CREATE = "PROJECT_CHAT_CREATE",
    PROJECT_CHAT_DELETE = "PROJECT_CHAT_DELETE",
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
              mentionedMemberIds?: string[];
              repliedToId?: string;
          };
      }
    | {
          type: InboundSocketMessageType.CHAT_DELETE;
          payload: {
              chatId: string;
          };
      }
    | {
          type: InboundSocketMessageType.PROJECT_CHAT_CREATE;
          payload: {
              message: string;
              mentionedMemberIds?: string[];
              repliedToId?: string;
          };
      }
    | {
          type: InboundSocketMessageType.PROJECT_CHAT_DELETE;
          payload: {
              chatId: string;
          };
      };

// Server -> Client
export enum OutboundSocketMessageType {
    ISSUE_CREATED = "ISSUE_CREATED",
    CHAT_CREATED = "CHAT_CREATED",
    CHAT_DELETED = "CHAT_DELETED",
    CHAT_ERROR = "CHAT_ERROR",
    PROJECT_CHAT_CREATED = "PROJECT_CHAT_CREATED",
    PROJECT_CHAT_DELETED = "PROJECT_CHAT_DELETED",
    NOTIFICATION_CREATED = "NOTIFICATION_CREATED",
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
      }
    | {
          type: OutboundSocketMessageType.CHAT_DELETED;
          projectId: string;
          payload: Chat;
      }
    | {
          type: OutboundSocketMessageType.PROJECT_CHAT_CREATED;
          projectId: string;
          payload: ProjectChat;
      }
    | {
          type: OutboundSocketMessageType.PROJECT_CHAT_DELETED;
          projectId: string;
          payload: ProjectChat;
      }
    | {
          type: OutboundSocketMessageType.NOTIFICATION_CREATED;
          projectId: string;
          payload: Notification;
      };
