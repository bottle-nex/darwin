import { IssueStatus } from "../prisma/enums.prisma";

export const ISSUE_LANE_NAME: Record<IssueStatus, string> = {
    [IssueStatus.Todo]: "To Do",
    [IssueStatus.Queued]: "Queued",
    [IssueStatus.InProgress]: "In Progress",
    [IssueStatus.AwaitingApproval]: "Awaiting Approval",
    [IssueStatus.InReview]: "In Review",
    [IssueStatus.Done]: "Done",
    [IssueStatus.Failed]: "Failed",
    [IssueStatus.Cancelled]: "Cancelled",
    [IssueStatus.Parked]: "a board column",
};

export const HUMAN_ISSUE_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
    [IssueStatus.Todo]: [IssueStatus.Parked, IssueStatus.Cancelled],
    [IssueStatus.Parked]: [IssueStatus.Todo, IssueStatus.Cancelled],
    [IssueStatus.Queued]: [],
    [IssueStatus.InProgress]: [],
    // The agent owns the issue until the pull request decision is made, so a person moves it by
    // answering that question rather than by dragging the card.
    [IssueStatus.AwaitingApproval]: [],
    [IssueStatus.InReview]: [IssueStatus.Cancelled],
    [IssueStatus.Done]: [],
    [IssueStatus.Failed]: [IssueStatus.Cancelled],
    [IssueStatus.Cancelled]: [],
};

export function canMoveIssue(from: IssueStatus, to: IssueStatus): boolean {
    return from === to || HUMAN_ISSUE_TRANSITIONS[from].includes(to);
}

export function hasHumanMove(status: IssueStatus): boolean {
    return HUMAN_ISSUE_TRANSITIONS[status].length > 0;
}

export const REOPENABLE_STATUSES: IssueStatus[] = [
    IssueStatus.InReview,
    IssueStatus.Failed,
    IssueStatus.Cancelled,
];

export function isReopenable(status: IssueStatus): boolean {
    return REOPENABLE_STATUSES.includes(status);
}

export const ISSUE_BODY_EDITABLE_STATUSES: IssueStatus[] = [
    IssueStatus.Todo,
    IssueStatus.Queued,
    IssueStatus.Parked,
];

export function isBodyEditable(status: IssueStatus): boolean {
    return ISSUE_BODY_EDITABLE_STATUSES.includes(status);
}
