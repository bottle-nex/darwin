export const QueueName = {
    IssueRouter: "issue.router",
    IssueVm: "issue.vm",
    ProjectOnboard: "project.onboard",
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
