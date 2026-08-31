import type { RunLogEvent } from "../logs/run-log.contract";
import type {
    AgentSession,
    Chat,
    Issue,
    IssueActivity,
    Notification,
    ProjectChat,
    TeamChat,
} from "../prisma/schemas.prisma";

export enum InboundSocketMessageType {
    ISSUE_CREATE = "ISSUE_CREATE",
    CHAT_CREATE = "CHAT_CREATE",
    CHAT_DELETE = "CHAT_DELETE",
    CHAT_REACTION_TOGGLE = "CHAT_REACTION_TOGGLE",
    PROJECT_CHAT_CREATE = "PROJECT_CHAT_CREATE",
    PROJECT_CHAT_DELETE = "PROJECT_CHAT_DELETE",
    PROJECT_CHAT_REACTION_TOGGLE = "PROJECT_CHAT_REACTION_TOGGLE",
    TEAM_CHAT_CREATE = "TEAM_CHAT_CREATE",
    TEAM_CHAT_DELETE = "TEAM_CHAT_DELETE",
    TEAM_CHAT_REACTION_TOGGLE = "TEAM_CHAT_REACTION_TOGGLE",
    RUN_LOG_SUBSCRIBE = "RUN_LOG_SUBSCRIBE",
    RUN_LOG_UNSUBSCRIBE = "RUN_LOG_UNSUBSCRIBE",
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
              operationId: string;
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
              operationId: string;
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
      }
    | {
          type: InboundSocketMessageType.TEAM_CHAT_CREATE;
          payload: { teamId: string; message: string; repliedToId?: string; operationId: string };
      }
    | {
          type: InboundSocketMessageType.TEAM_CHAT_DELETE;
          payload: { chatId: string };
      }
    | {
          type: InboundSocketMessageType.TEAM_CHAT_REACTION_TOGGLE;
          payload: { chatId: string; emoji: string; operationId: string };
      }
    | {
          type: InboundSocketMessageType.RUN_LOG_SUBSCRIBE;
          payload: { runId: string };
      }
    | {
          type: InboundSocketMessageType.RUN_LOG_UNSUBSCRIBE;
          payload: { runId: string };
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
    TEAM_CHAT_CREATED = "TEAM_CHAT_CREATED",
    TEAM_CHAT_DELETED = "TEAM_CHAT_DELETED",
    TEAM_CHAT_REACTION_UPDATED = "TEAM_CHAT_REACTION_UPDATED",
    NOTIFICATION_CREATED = "NOTIFICATION_CREATED",
    ACTIVITY_CREATED = "ACTIVITY_CREATED",
    AGENT_SESSION_UPDATED = "AGENT_SESSION_UPDATED",
    RUN_LOG_APPENDED = "RUN_LOG_APPENDED",
    RUN_LOG_SEALED = "RUN_LOG_SEALED",
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
          previous: Pick<Issue, "status" | "customColumnId">;
      }
    | {
          type: OutboundSocketMessageType.CHAT_CREATED;
          projectId: string;
          payload: Chat;
          operationId: string;
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
          operationId: string;
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
          type: OutboundSocketMessageType.TEAM_CHAT_CREATED;
          projectId: string;
          teamId: string;
          payload: TeamChat;
          operationId: string;
      }
    | {
          type: OutboundSocketMessageType.TEAM_CHAT_DELETED;
          projectId: string;
          teamId: string;
          payload: TeamChat;
      }
    | {
          type: OutboundSocketMessageType.TEAM_CHAT_REACTION_UPDATED;
          projectId: string;
          teamId: string;
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
      }
    /** One message per emit batch — publishing per row would let concurrent edits interleave. */
    | {
          type: OutboundSocketMessageType.ACTIVITY_CREATED;
          projectId: string;
          payload: { issueId: string; activities: IssueActivity[] };
      }
    | {
          type: OutboundSocketMessageType.AGENT_SESSION_UPDATED;
          projectId: string;
          payload: AgentSession;
      }
    | {
          type: OutboundSocketMessageType.RUN_LOG_APPENDED;
          projectId: string;
          runId: string;
          payload: { events: RunLogEvent[]; cursor: number };
      }
    | {
          type: OutboundSocketMessageType.RUN_LOG_SEALED;
          projectId: string;
          runId: string;
          payload: { eventCount: number; droppedEvents: number };
      };

export function project_channel_name(project_id: string): string {
    return `project:${project_id}`;
}
