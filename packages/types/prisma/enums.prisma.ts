export const OrgRole = {
    Owner: "Owner",
    Admin: "Admin",
    Member: "Member",
    Billing: "Billing",
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

export const ProjectRole = {
    Admin: "Admin",
    Maintain: "Maintain",
    Write: "Write",
    Triage: "Triage",
    Read: "Read",
} as const;
export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

export const TeamRole = {
    Maintainer: "Maintainer",
    Member: "Member",
} as const;
export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const IssueStatus = {
    Todo: "Todo",
    Queued: "Queued",
    InProgress: "InProgress",
    InReview: "InReview",
    Done: "Done",
    Failed: "Failed",
    Cancelled: "Cancelled",
    Parked: "Parked",
} as const;
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

export const NotificationType = {
    IssueAssigned: "IssueAssigned",
    IssueUnassigned: "IssueUnassigned",
    ChatMention: "ChatMention",
    ProjectChatMention: "ProjectChatMention",
    IssueStatusChanged: "IssueStatusChanged",
    IssuePriorityChanged: "IssuePriorityChanged",
    IssueMoved: "IssueMoved",
    IssueCommented: "IssueCommented",
    IssueReferenced: "IssueReferenced",
    IssueDeleted: "IssueDeleted",
    InviteAccepted: "InviteAccepted",
    AddedToProject: "AddedToProject",
    AddedToTeam: "AddedToTeam",
    RemovedFromTeam: "RemovedFromTeam",
    RemovedFromOrg: "RemovedFromOrg",
    RoleChanged: "RoleChanged",
    MessageReacted: "MessageReacted",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const PostKind = {
    Blog: "Blog",
    Changelog: "Changelog",
} as const;
export type PostKind = (typeof PostKind)[keyof typeof PostKind];

export const PostStatus = {
    Draft: "Draft",
    Published: "Published",
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const ReleaseChannel = {
    Beta: "Beta",
    Stable: "Stable",
} as const;
export type ReleaseChannel = (typeof ReleaseChannel)[keyof typeof ReleaseChannel];
