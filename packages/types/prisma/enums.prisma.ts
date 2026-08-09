// Mirrors the Prisma-generated enums (const object + string-literal union) so that
// values returned from the Prisma client are structurally assignable to these types.
// Keep in sync with the enums in packages/database/prisma/schema.prisma.

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

export const Chunk = {
    Imports: "Imports",
    Function: "Function",
    Class: "Class",
    Interface: "Interface",
    Type: "Type",
    Variable: "Variable",
    Block: "Block",
} as const;
export type Chunk = (typeof Chunk)[keyof typeof Chunk];

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
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
