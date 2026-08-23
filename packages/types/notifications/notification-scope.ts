import { NotificationType } from "../prisma/enums.prisma";

export const NotificationScope = {
    Project: "project",
    Member: "member",
} as const;
export type NotificationScope = (typeof NotificationScope)[keyof typeof NotificationScope];

export const NOTIFICATION_SCOPE = {
    [NotificationType.IssueAssigned]: NotificationScope.Project,
    [NotificationType.IssueUnassigned]: NotificationScope.Project,
    [NotificationType.IssueStatusChanged]: NotificationScope.Project,
    [NotificationType.IssuePriorityChanged]: NotificationScope.Project,
    [NotificationType.IssueMoved]: NotificationScope.Project,
    [NotificationType.IssueCommented]: NotificationScope.Project,
    [NotificationType.IssueReferenced]: NotificationScope.Project,
    [NotificationType.IssueDeleted]: NotificationScope.Project,
    [NotificationType.ChatMention]: NotificationScope.Project,
    [NotificationType.ProjectChatMention]: NotificationScope.Project,
    [NotificationType.TeamChatMention]: NotificationScope.Project,
    [NotificationType.MessageReacted]: NotificationScope.Project,
    [NotificationType.AddedToProject]: NotificationScope.Member,
    [NotificationType.AddedToTeam]: NotificationScope.Member,
    [NotificationType.RemovedFromTeam]: NotificationScope.Member,
    [NotificationType.RemovedFromOrg]: NotificationScope.Member,
    [NotificationType.RoleChanged]: NotificationScope.Member,
    [NotificationType.InviteAccepted]: NotificationScope.Member,
} as const satisfies Record<NotificationType, NotificationScope>;

export type ProjectNotificationType = {
    [K in NotificationType]: (typeof NOTIFICATION_SCOPE)[K] extends typeof NotificationScope.Project
        ? K
        : never;
}[NotificationType];

export type MemberNotificationType = Exclude<NotificationType, ProjectNotificationType>;

export function notification_scope(type: NotificationType): NotificationScope {
    return NOTIFICATION_SCOPE[type];
}

function types_in_scope(scope: NotificationScope): NotificationType[] {
    return (Object.keys(NOTIFICATION_SCOPE) as NotificationType[]).filter(
        (type) => NOTIFICATION_SCOPE[type] === scope,
    );
}

export const PROJECT_NOTIFICATION_TYPES = types_in_scope(
    NotificationScope.Project,
) as ProjectNotificationType[];

export const MEMBER_NOTIFICATION_TYPES = types_in_scope(
    NotificationScope.Member,
) as MemberNotificationType[];
