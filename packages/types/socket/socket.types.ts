import type { Chat, Issue, Notification, ProjectChat } from "../prisma/schemas.prisma";

export enum InboundSocketMessageType {
    ISSUE_CREATE = "ISSUE_CREATE",
    CHAT_CREATE = "CHAT_CREATE",
    CHAT_DELETE = "CHAT_DELETE",
    CHAT_REACTION_TOGGLE = "CHAT_REACTION_TOGGLE",
    PROJECT_CHAT_CREATE = "PROJECT_CHAT_CREATE",
    PROJECT_CHAT_DELETE = "PROJECT_CHAT_DELETE",
    PROJECT_CHAT_REACTION_TOGGLE = "PROJECT_CHAT_REACTION_TOGGLE",
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
          type: InboundSocketMessageType.CHAT_REACTION_TOGGLE;
          payload: { chatId: string; emoji: string; operationId: string };
      }
    | {
          type: InboundSocketMessageType.PROJECT_CHAT_CREATE;
          payload: {
              message: string;
              repliedToId?: string;
          };
      }
    | {
          type: InboundSocketMessageType.PROJECT_CHAT_DELETE;
          payload: {
              chatId: string;
          };
      }
    | {
          type: InboundSocketMessageType.PROJECT_CHAT_REACTION_TOGGLE;
          payload: { chatId: string; emoji: string; operationId: string };
      };

export enum OutboundSocketMessageType {
    ISSUE_CREATED = "ISSUE_CREATED",
    ISSUE_UPDATED = "ISSUE_UPDATED",
    CHAT_CREATED = "CHAT_CREATED",
    CHAT_DELETED = "CHAT_DELETED",
    CHAT_REACTION_UPDATED = "CHAT_REACTION_UPDATED",
    CHAT_ERROR = "CHAT_ERROR",
    PROJECT_CHAT_CREATED = "PROJECT_CHAT_CREATED",
    PROJECT_CHAT_DELETED = "PROJECT_CHAT_DELETED",
    PROJECT_CHAT_REACTION_UPDATED = "PROJECT_CHAT_REACTION_UPDATED",
    NOTIFICATION_CREATED = "NOTIFICATION_CREATED",
}

export type OutboundSocketMessage =
    | {
          type: OutboundSocketMessageType.ISSUE_CREATED;
          projectId: string;
          payload: Issue;
      }
    | {
          type: OutboundSocketMessageType.ISSUE_UPDATED;
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
          operationId?: string;
      }
    | {
          type: OutboundSocketMessageType.CHAT_DELETED;
          projectId: string;
          payload: Chat;
      }
    | {
          type: OutboundSocketMessageType.CHAT_REACTION_UPDATED;
          projectId: string;
          payload: {
              chatId: string;
              updates: { emoji: string; count: number; actorReacted: boolean }[];
              actorId: string;
              operationId: string;
          };
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
          type: OutboundSocketMessageType.PROJECT_CHAT_REACTION_UPDATED;
          projectId: string;
          payload: {
              chatId: string;
              updates: { emoji: string; count: number; actorReacted: boolean }[];
              actorId: string;
              operationId: string;
          };
      }
    | {
          type: OutboundSocketMessageType.NOTIFICATION_CREATED;
          payload: Notification;
      };
