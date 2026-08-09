export const QueueName = {
    IssueRouter: "issue.router",
    IssueVm: "issue.vm",
    ProjectOnboard: "project.onboard",
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

export type NotificationJobData =
    | { action: "issue.assigned"; issueId: string; assigneeId: string; actorId: string }
    | { action: "issue.unassigned"; issueId: string; assigneeId: string; actorId: string }
    | { action: "chat.mention"; chatId: string; memberId: string; mentionedById: string }
    | {
          action: "project_chat.mention";
          projectChatId: string;
          memberId: string;
          mentionedById: string;
      };
