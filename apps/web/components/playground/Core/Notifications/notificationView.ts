import { type Notification, NotificationType } from "@trymatcha/types";
import type { IconType } from "@trymatcha/ui/icons";
import {
    AccessChangedIcon,
    CommentCountIcon,
    DeleteIcon,
    EmojiReactionIcon,
    InviteAcceptedIcon,
    IssueAssignedIcon,
    IssueMovedIcon,
    IssueReferencedIcon,
    MentionIcon,
    NotificationsBellIcon,
    PersonRemovedNotificationIcon,
    ProjectReferenceIcon,
    RemovedFromOrgIcon,
    StatusChangedIcon,
    TeamEntityIcon,
    WarningTriangleIcon,
} from "@trymatcha/ui/icons";
import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";

import { issueIdentifier } from "@/lib/format";
export type NotificationView = {
    actorId: string;
    actorName: string;
    action: string;
    body: string;
    issueRef: string | null;
    projectSlug: string | null;
};

type NotificationTheme = { icon: IconType; tint: string };

const THEME: Record<NotificationType, NotificationTheme> = {
    [NotificationType.IssueAssigned]: { icon: IssueAssignedIcon, tint: "text-primary" },
    [NotificationType.IssueUnassigned]: {
        icon: PersonRemovedNotificationIcon,
        tint: "text-neutral-400",
    },
    [NotificationType.ChatMention]: { icon: MentionIcon, tint: "text-primary" },
    [NotificationType.ProjectChatMention]: { icon: MentionIcon, tint: "text-matcha" },
    [NotificationType.TeamChatMention]: { icon: MentionIcon, tint: "text-matcha" },
    [NotificationType.DescriptionMention]: { icon: MentionIcon, tint: "text-primary" },
    [NotificationType.IssueStatusChanged]: { icon: StatusChangedIcon, tint: "text-matcha" },
    [NotificationType.IssuePriorityChanged]: {
        icon: WarningTriangleIcon,
        tint: "text-brick-foreground",
    },
    [NotificationType.IssueMoved]: { icon: IssueMovedIcon, tint: "text-primary" },
    [NotificationType.IssueCommented]: {
        icon: CommentCountIcon,
        tint: "text-primary",
    },
    [NotificationType.IssueReferenced]: { icon: IssueReferencedIcon, tint: "text-primary" },
    [NotificationType.IssueDeleted]: { icon: DeleteIcon, tint: "text-neutral-400" },
    [NotificationType.InviteAccepted]: { icon: InviteAcceptedIcon, tint: "text-matcha" },
    [NotificationType.AddedToProject]: { icon: ProjectReferenceIcon, tint: "text-primary" },
    [NotificationType.AddedToTeam]: { icon: TeamEntityIcon, tint: "text-primary" },
    [NotificationType.RemovedFromTeam]: {
        icon: PersonRemovedNotificationIcon,
        tint: "text-neutral-400",
    },
    [NotificationType.RemovedFromOrg]: { icon: RemovedFromOrgIcon, tint: "text-brick-foreground" },
    [NotificationType.RoleChanged]: { icon: AccessChangedIcon, tint: "text-primary" },
    [NotificationType.MessageReacted]: { icon: EmojiReactionIcon, tint: "text-matcha" },
};

const FALLBACK_THEME: NotificationTheme = { icon: NotificationsBellIcon, tint: "text-neutral-400" };

export function theme_of(notification: Notification): NotificationTheme {
    return THEME[notification.type] ?? FALLBACK_THEME;
}

export function notification_view(notification: Notification): NotificationView {
    const payload = notification.payload as Record<string, string | number>;
    const projectSlug = payload.projectSlug ? String(payload.projectSlug) : null;
    // The payload has no project name, only its slug — which is generated from the
    // name, so it keys to the same three letters.
    const issueRef = payload.issueNumber
        ? issueIdentifier(projectSlug ?? undefined, payload.issueNumber)
        : null;

    switch (notification.type) {
        case NotificationType.IssueAssigned:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: "assigned you to",
                body: String(payload.issueTitle),
                issueRef,
                projectSlug,
            };
        case NotificationType.IssueUnassigned:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: "unassigned you from",
                body: String(payload.issueTitle),
                issueRef,
                projectSlug,
            };
        case NotificationType.ChatMention:
            return {
                actorId: String(payload.senderId ?? ""),
                actorName: String(payload.senderName),
                action: "mentioned you",
                body: String(payload.message),
                issueRef: issueRef ? `${issueRef} ${payload.issueTitle}` : null,
                projectSlug,
            };
        case NotificationType.IssueReferenced:
            return {
                actorId: String(payload.senderId ?? ""),
                actorName: String(payload.senderName),
                action: "referenced",
                body: String(payload.message),
                issueRef: issueRef ? `${issueRef} ${payload.issueTitle}` : null,
                projectSlug,
            };
        case NotificationType.ProjectChatMention:
            return {
                actorId: String(payload.senderId ?? ""),
                actorName: String(payload.senderName),
                action: "mentioned you in project chat",
                body: String(payload.message),
                issueRef: null,
                projectSlug,
            };
        case NotificationType.TeamChatMention:
            return {
                actorId: String(payload.senderId ?? ""),
                actorName: String(payload.senderName),
                action: `mentioned you in ${String(payload.teamName)} chat`,
                body: String(payload.message),
                issueRef: null,
                projectSlug,
            };
        case NotificationType.DescriptionMention:
            return {
                actorId: String(payload.senderId ?? ""),
                actorName: String(payload.senderName),
                action: "mentioned you in",
                body: String(payload.issueTitle),
                issueRef,
                projectSlug,
            };
        case NotificationType.IssueStatusChanged:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: `changed status to ${status_label(String(payload.toStatus))}`,
                body: String(payload.issueTitle),
                issueRef,
                projectSlug,
            };
        case NotificationType.IssuePriorityChanged:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: "marked urgent",
                body: String(payload.issueTitle),
                issueRef,
                projectSlug,
            };
        case NotificationType.IssueMoved:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: `moved to ${payload.toColumnLabel ? String(payload.toColumnLabel) : "the board"}`,
                body: String(payload.issueTitle),
                issueRef,
                projectSlug,
            };
        case NotificationType.IssueCommented:
            return {
                actorId: String(payload.senderId ?? ""),
                actorName: String(payload.senderName),
                action: "commented",
                body: String(payload.message),
                issueRef: issueRef ? `${issueRef} ${payload.issueTitle}` : null,
                projectSlug,
            };
        case NotificationType.IssueDeleted:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: "deleted an issue you were on",
                body: String(payload.issueTitle),
                issueRef,
                projectSlug,
            };
        case NotificationType.InviteAccepted:
            return {
                actorId: String(payload.accepterId ?? ""),
                actorName: String(payload.accepterName),
                action: "accepted your invite",
                body: String(payload.teamName ?? payload.projectName ?? payload.orgName),
                issueRef: null,
                projectSlug,
            };
        case NotificationType.AddedToProject:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: "added you to a project",
                body: String(payload.projectName),
                issueRef: null,
                projectSlug,
            };
        case NotificationType.AddedToTeam:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: "added you to a team",
                body: String(payload.teamName),
                issueRef: null,
                projectSlug,
            };
        case NotificationType.RemovedFromTeam:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: "removed you from a team",
                body: String(payload.teamName),
                issueRef: null,
                projectSlug,
            };
        case NotificationType.RemovedFromOrg:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: "removed you from an organization",
                body: String(payload.orgName),
                issueRef: null,
                projectSlug,
            };
        case NotificationType.RoleChanged:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: `changed your team role to ${payload.role}`,
                body: String(payload.teamName),
                issueRef: null,
                projectSlug,
            };
        case NotificationType.MessageReacted:
            return {
                actorId: String(payload.actorId ?? ""),
                actorName: String(payload.actorName),
                action: `reacted ${String(payload.emoji)} to your message`,
                body: "",
                issueRef: issueRef ? `${issueRef} ${payload.issueTitle}` : null,
                projectSlug,
            };
        default:
            return {
                actorId: notification.id,
                actorName: "matcha",
                action: "sent you an update",
                body: "",
                issueRef: null,
                projectSlug,
            };
    }
}

/** Where selecting a notification takes you: an issue, the project chat, or just the project. */
export type NotificationDestination =
    { kind: "issue"; issueId: string } | { kind: "chats"; teamId?: string };

export function notification_target(
    notification: Notification,
): { orgSlug: string; projectSlug: string; destination: NotificationDestination | null } | null {
    const payload = notification.payload as Record<string, string | number>;
    if (!payload.orgSlug || !payload.projectSlug) return null;
    const orgSlug = String(payload.orgSlug);
    const projectSlug = String(payload.projectSlug);

    switch (notification.type) {
        case NotificationType.IssueAssigned:
        case NotificationType.IssueUnassigned:
        case NotificationType.ChatMention:
        case NotificationType.IssueStatusChanged:
        case NotificationType.IssuePriorityChanged:
        case NotificationType.IssueMoved:
        case NotificationType.IssueCommented:
        case NotificationType.IssueReferenced:
            if (!payload.issueId) return null;
            return {
                orgSlug,
                projectSlug,
                destination: { kind: "issue", issueId: String(payload.issueId) },
            };
        case NotificationType.ProjectChatMention:
            return { orgSlug, projectSlug, destination: { kind: "chats" } };
        case NotificationType.TeamChatMention:
            if (!payload.teamId) return null;
            return {
                orgSlug,
                projectSlug,
                destination: { kind: "chats", teamId: String(payload.teamId) },
            };
        case NotificationType.MessageReacted:
            if (payload.issueId) {
                return {
                    orgSlug,
                    projectSlug,
                    destination: { kind: "issue", issueId: String(payload.issueId) },
                };
            }
            if (payload.projectChatId)
                return { orgSlug, projectSlug, destination: { kind: "chats" } };
            if (payload.teamChatId && payload.teamId) {
                return {
                    orgSlug,
                    projectSlug,
                    destination: { kind: "chats", teamId: String(payload.teamId) },
                };
            }
            return null;
        case NotificationType.IssueDeleted:
        case NotificationType.InviteAccepted:
        case NotificationType.AddedToProject:
        case NotificationType.AddedToTeam:
        case NotificationType.RemovedFromTeam:
        case NotificationType.RoleChanged:
            return { orgSlug, projectSlug, destination: null };
        default:
            return null;
    }
}

const STATUS_LABEL: Record<string, string> = {
    InProgress: "In Progress",
    InReview: "In Review",
};

function status_label(status: string): string {
    return STATUS_LABEL[status] ?? status;
}

const SHORT_UNIT: Record<string, string> = {
    second: "s",
    minute: "m",
    hour: "h",
    day: "d",
    week: "w",
    month: "mo",
    year: "y",
};

export function short_age(date: Date): string {
    const [value, unit] = formatDistanceToNowStrict(date).split(" ");
    return `${value}${SHORT_UNIT[unit.replace(/s$/, "")] ?? ""}`;
}

export function day_label(date: Date): string {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
}
