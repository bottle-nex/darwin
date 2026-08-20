"use client";
import { useState } from "react";
import type { Notification } from "@trymatcha/types";
import { cn } from "@/lib/utils";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import NotificationList from "@/components/playground/Core/Notifications/NotificationList";
import NotificationSearch from "@/components/playground/Core/Notifications/NotificationSearch";
import { useMarkNotificationsRead } from "@/hooks/notifications/useNotifications";
import { useInboxStore, type InboxFilter } from "@/store/playground/useInboxStore";
import InboxDetail from "./InboxDetail";
import { useInboxNotifications } from "./useInboxNotifications";

const FILTERS: { value: InboxFilter; label: string }[] = [
    { value: "all", label: "Inbox" },
    { value: "unread", label: "Unread" },
];

export default function InboxDisplay() {
    const [query, setQuery] = useState<string>("");
    const { notifications, selected, unreadCount } = useInboxNotifications();
    const filter = useInboxStore((state) => state.filter);
    const setFilter = useInboxStore((state) => state.setFilter);
    const select = useInboxStore((state) => state.select);
    const { mutate: mark_read } = useMarkNotificationsRead();

    function open(notification: Notification) {
        if (!notification.readAt) mark_read({ ids: [notification.id] });
        select(notification.id);
    }

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-row">
            <PaneLeadSlot>
                <PlaygroundBreadcrumb />
            </PaneLeadSlot>

            <aside className="flex min-h-0 w-90 max-w-[42%] shrink-0 flex-col border-r border-graphite">
                <div className="flex shrink-0 items-center gap-1 px-2 pt-2">
                    {FILTERS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setFilter(option.value)}
                            className={cn(
                                "cursor-pointer rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
                                filter === option.value
                                    ? "bg-white/7 text-neutral-100"
                                    : "text-neutral-500 hover:bg-white/4 hover:text-neutral-200",
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={() => mark_read({})}
                            className="ml-auto cursor-pointer rounded-md px-1.5 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="shrink-0 p-2">
                    <NotificationSearch value={query} onChange={setQuery} />
                </div>

                <NotificationList
                    notifications={notifications}
                    query={query}
                    selectedId={selected?.id ?? null}
                    clickableRows="all"
                    emptyTitle={query.trim() ? "No matches" : "You're all caught up"}
                    emptySubtitle={
                        query.trim()
                            ? `Nothing matches “${query.trim()}”.`
                            : "Assignments and mentions for this project land here."
                    }
                    headerClassName="bg-charcoal/70 backdrop-blur-sm"
                    onSelect={open}
                />
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <InboxDetail notification={selected} />
            </div>
        </div>
    );
}
