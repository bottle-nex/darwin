import { formatDistanceToNowStrict, isToday, isYesterday, format } from "date-fns";
import type { IconType } from "react-icons";
import {
    HiOutlineArrowPath,
    HiOutlineArrowsRightLeft,
    HiOutlineAtSymbol,
    HiOutlineBell,
    HiOutlineChatBubbleLeftRight,
    HiOutlineCheckBadge,
    HiOutlineExclamationTriangle,
    HiOutlineHashtag,
    HiOutlineKey,
    HiOutlineNoSymbol,
    HiOutlineRectangleGroup,
    HiOutlineTrash,
    HiOutlineUserGroup,
    HiOutlineUserMinus,
    HiOutlineUserPlus,
} from "react-icons/hi2";
import { NotificationType, type Notification } from "@trymatcha/types";
import type { SelectedThread } from "@/store/playground/usePlaygroundNavStore";

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
    [NotificationType.IssueAssigned]: { icon: HiOutlineUserPlus, tint: "text-violet-300" },
    [NotificationType.IssueUnassigned]: { icon: HiOutlineUserMinus, tint: "text-neutral-400" },
    [NotificationType.ChatMention]: { icon: HiOutlineAtSymbol, tint: "text-sky-300" },
    [NotificationType.ProjectChatMention]: { icon: HiOutlineAtSymbol, tint: "text-emerald-300" },
    [NotificationType.IssueStatusChanged]: { icon: HiOutlineArrowPath, tint: "text-amber-300" },
    [NotificationType.IssuePriorityChanged]: {
        icon: HiOutlineExclamationTriangle,
        tint: "text-rose-300",
    },
    [NotificationType.IssueMoved]: { icon: HiOutlineArrowsRightLeft, tint: "text-sky-300" },
    [NotificationType.IssueCommented]: {
        icon: HiOutlineChatBubbleLeftRight,
        tint: "text-indigo-300",
    },
    [NotificationType.IssueReferenced]: { icon: HiOutlineHashtag, tint: "text-sky-300" },
    [NotificationType.IssueDeleted]: { icon: HiOutlineTrash, tint: "text-neutral-400" },
    [NotificationType.InviteAccepted]: { icon: HiOutlineCheckBadge, tint: "text-emerald-300" },
    [NotificationType.AddedToProject]: { icon: HiOutlineRectangleGroup, tint: "text-violet-300" },
    [NotificationType.AddedToTeam]: { icon: HiOutlineUserGroup, tint: "text-violet-300" },
    [NotificationType.RemovedFromTeam]: { icon: HiOutlineUserMinus, tint: "text-neutral-400" },
    [NotificationType.RemovedFromOrg]: { icon: HiOutlineNoSymbol, tint: "text-rose-300" },
    [NotificationType.RoleChanged]: { icon: HiOutlineKey, tint: "text-amber-300" },
};

const FALLBACK_THEME: NotificationTheme = { icon: HiOutlineBell, tint: "text-neutral-400" };

export function theme_of(notification: Notification): NotificationTheme {
    return THEME[notification.type] ?? FALLBACK_THEME;
}

export function notification_view(notification: Notification): NotificationView {
    const payload = notification.payload as Record<string, string | number>;
    const projectSlug = payload.projectSlug ? String(payload.projectSlug) : null;
    const issueRef = payload.issueNumber ? `#${payload.issueNumber}` : null;

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

export function notification_target(
    notification: Notification,
): { orgSlug: string; projectSlug: string; thread: SelectedThread | null } | null {
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
                thread: {
                    kind: "issue",
                    issueId: String(payload.issueId),
                    issueNumber: Number(payload.issueNumber),
                    issueTitle: String(payload.issueTitle),
                },
            };
        case NotificationType.ProjectChatMention:
            return { orgSlug, projectSlug, thread: { kind: "project" } };
        case NotificationType.IssueDeleted:
        case NotificationType.InviteAccepted:
        case NotificationType.AddedToProject:
        case NotificationType.AddedToTeam:
        case NotificationType.RemovedFromTeam:
        case NotificationType.RoleChanged:
            return { orgSlug, projectSlug, thread: null };
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

export function group_by_day(
    notifications: Notification[],
): { label: string; items: Notification[] }[] {
    const groups: { label: string; items: Notification[] }[] = [];
    for (const notification of notifications) {
        const label = day_label(new Date(notification.createdAt));
        const current = groups[groups.length - 1];
        if (current?.label === label) current.items.push(notification);
        else groups.push({ label, items: [notification] });
    }
    return groups;
}
