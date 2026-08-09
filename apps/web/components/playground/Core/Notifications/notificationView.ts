import { formatDistanceToNowStrict, isToday, isYesterday, format } from "date-fns";
import type { IconType } from "react-icons";
import {
    HiOutlineAtSymbol,
    HiOutlineBell,
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
};

const FALLBACK_THEME: NotificationTheme = { icon: HiOutlineBell, tint: "text-neutral-400" };

export function theme_of(notification: Notification): NotificationTheme {
    return THEME[notification.type] ?? FALLBACK_THEME;
}

/** Splits a notification into the parts a row renders separately, so each can carry its own weight. */
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
        case NotificationType.ProjectChatMention:
            return {
                actorId: String(payload.senderId ?? ""),
                actorName: String(payload.senderName),
                action: "mentioned you in project chat",
                body: String(payload.message),
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

/** Where clicking a notification should land — the chat thread it came from. `null` if the payload can't place it anywhere (e.g. an older notification from before this field existed). */
export function notification_target(
    notification: Notification,
): { orgSlug: string; projectSlug: string; thread: SelectedThread } | null {
    const payload = notification.payload as Record<string, string | number>;
    if (!payload.orgSlug || !payload.projectSlug) return null;
    const orgSlug = String(payload.orgSlug);
    const projectSlug = String(payload.projectSlug);

    switch (notification.type) {
        case NotificationType.IssueAssigned:
        case NotificationType.IssueUnassigned:
        case NotificationType.ChatMention:
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
        default:
            return null;
    }
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

/** "2h", "3d" — a right-aligned age has to stay one glance wide. */
export function short_age(date: Date): string {
    const [value, unit] = formatDistanceToNowStrict(date).split(" ");
    return `${value}${SHORT_UNIT[unit.replace(/s$/, "")] ?? ""}`;
}

export function day_label(date: Date): string {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
}

/** Consecutive notifications sharing a calendar day, in the order the list already has them. */
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
