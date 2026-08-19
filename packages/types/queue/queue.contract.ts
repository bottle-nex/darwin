import type { IssueStatus, ProjectRole, TeamRole } from "../prisma/enums.prisma";

export const QueueName = {
    IssueRouter: "issue.router",
    IssueVm: "issue.vm",
    ProjectOnboard: "project.onboard",
    ProductDiff: "product.diff",
    IssueOutcome: "issue.outcome",
    Notification: "notification.dispatch",
} as const;
export type QueueName = (typeof QueueName)[keyof typeof QueueName];

export interface RouteJobData {
    projectId: string;
}

export interface DispatchJobData {
    workerId: string;
}

export interface OnboardJobData {
    session_id: string;
    project_id: string;
    repo_url: string;
    branch: string;
    installation_id: number;
}

export interface ProductDiffJobData {
    productDiffId: string;
}

export type IssueOutcomeJobData =
    | {
          kind: "pr_opened";
          issueId: string;
          workerId: string;
          prUrl: string;
          branch: string;
          summary: string;
          runId?: string;
      }
    | { kind: "failed"; issueId: string; workerId: string; reason: string; runId?: string }
    | { kind: "reconcile"; issueId: string };

export type NotificationJobData =
    | { action: "issue.assigned"; issueId: string; assigneeId: string; actorId: string }
    | { action: "issue.unassigned"; issueId: string; assigneeId: string; actorId: string }
    | { action: "chat.mention"; chatId: string; memberId: string; mentionedById: string }
    | {
          action: "project_chat.mention";
          projectChatId: string;
          memberId: string;
          mentionedById: string;
      }
    | {
          action: "issue.status_changed";
          issueId: string;
          recipientId: string;
          actorId: string;
          fromStatus: IssueStatus;
          toStatus: IssueStatus;
      }
    | {
          action: "issue.priority_changed";
          issueId: string;
          recipientId: string;
          actorId: string;
          priority: number;
      }
    | {
          action: "issue.moved";
          issueId: string;
          recipientId: string;
          actorId: string;
          toColumnId: string | null;
      }
    | { action: "issue.commented"; chatId: string; recipientId: string; senderId: string }
    | {
          action: "issue.referenced";
          issueId: string;
          recipientId: string;
          actorId: string;
          chatId?: string;
          projectChatId?: string;
      }
    | {
          action: "issue.deleted";
          issueId: string;
          recipientId: string;
          actorId: string;
          issueNumber: number;
          issueTitle: string;
          projectId: string;
          projectSlug: string;
          orgSlug: string;
      }
    | { action: "invite.accepted"; invitationId: string; recipientId: string; accepterId: string }
    | {
          action: "member.added_to_project";
          projectId: string;
          recipientId: string;
          actorId: string;
          role: ProjectRole;
      }
    | { action: "member.added_to_team"; teamId: string; recipientId: string; actorId: string }
    | { action: "member.removed_from_team"; teamId: string; recipientId: string; actorId: string }
    | { action: "member.removed_from_org"; orgId: string; recipientId: string; actorId: string }
    | {
          action: "member.role_changed";
          teamId: string;
          recipientId: string;
          actorId: string;
          role: TeamRole;
          previousRole: TeamRole;
      }
    | {
          action: "message.reacted";
          reactionId: string;
          recipientId: string;
          actorId: string;
          emoji: string;
          chatId?: string;
          projectChatId?: string;
      };
