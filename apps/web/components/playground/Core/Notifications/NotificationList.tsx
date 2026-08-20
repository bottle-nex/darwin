"use client";
import { useMemo } from "react";
import { HiOutlineBell } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import type { Notification } from "@trymatcha/types";
import NotificationRow from "./NotificationRow";
import { group_by_day, notification_target, notification_view } from "./notificationView";

type NotificationListProps = {
    notifications: Notification[];
    query: string;
    selectedId?: string | null;
    clickableRows: "navigable" | "all";
    emptyTitle: string;
    emptySubtitle: string;
    headerClassName: string;
    onSelect: (notification: Notification) => void;
};

export function matches_query(notification: Notification, query: string): boolean {
    const { actorName, action, body, issueRef, projectSlug } = notification_view(notification);
    return `${actorName} ${action} ${body} ${issueRef ?? ""} ${projectSlug ?? ""}`
        .toLowerCase()
        .includes(query);
}

export default function NotificationList({
    notifications,
    query,
    selectedId,
    clickableRows,
    emptyTitle,
    emptySubtitle,
    headerClassName,
    onSelect,
}: NotificationListProps) {
    const groups = useMemo(() => {
        const trimmed = query.trim().toLowerCase();
        const matched = !trimmed
            ? notifications
            : notifications.filter((notification) => matches_query(notification, trimmed));
        return group_by_day(matched);
    }, [notifications, query]);

    if (groups.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
                <span
                    className="flex size-11 items-center justify-center rounded-xl bg-cement text-neutral-500 ring-1 ring-graphite"
                    aria-hidden
                >
                    <HiOutlineBell className="size-5" />
                </span>
                <p className="mt-3 text-[13px] font-medium text-neutral-300">{emptyTitle}</p>
                <p className="mt-1 text-[12px] text-neutral-500">{emptySubtitle}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto overscroll-contain px-1.5 pb-2">
            {groups.map((group) => (
                <section key={group.label}>
                    <h3
                        className={cn(
                            "sticky top-0 z-10 px-2 py-1.5 text-[10px] font-medium tracking-[0.08em] text-neutral-600 uppercase",
                            headerClassName,
                        )}
                    >
                        {group.label}
                    </h3>
                    {group.items.map((notification) => (
                        <NotificationRow
                            key={notification.id}
                            notification={notification}
                            clickable={
                                clickableRows === "all" ||
                                notification_target(notification) !== null
                            }
                            selected={selectedId === notification.id}
                            onSelect={() => onSelect(notification)}
                        />
                    ))}
                </section>
            ))}
        </div>
    );
}
