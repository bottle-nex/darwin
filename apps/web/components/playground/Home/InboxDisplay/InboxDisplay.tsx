"use client";
import type { Notification } from "@trymatcha/types";
import { useState } from "react";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import NotificationFeed from "@/components/playground/Core/Notifications/NotificationFeed";
import NotificationSearch from "@/components/playground/Core/Notifications/NotificationSearch";
import IconWrapper from "@/components/ui/IconWrapper";
import { useMarkNotificationsRead } from "@/hooks/notifications/useMarkNotificationsRead";
import { type InboxFilter, useInboxStore } from "@/store/playground/useInboxStore";

import InboxDetail from "./InboxDetail";
import { useInboxNotifications } from "./useInboxNotifications";

const FILTERS: { value: InboxFilter; label: string }[] = [
    { value: "all", label: "Inbox" },
    { value: "unread", label: "Unread" },
];

export default function InboxDisplay() {
    const [query, setQuery] = useState<string>("");
    const { projectId, feed, notifications, selected, unreadCount } = useInboxNotifications();
    const filter = useInboxStore((state) => state.filter);
    const setFilter = useInboxStore((state) => state.setFilter);
    const select = useInboxStore((state) => state.select);
    const { mutate: mark_read } = useMarkNotificationsRead();

    function open(notification: Notification) {
        if (!notification.readAt && projectId) {
            mark_read({ scope: "project", projectId, ids: [notification.id] });
        }
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
                            className="cursor-pointer"
                        >
                            <IconWrapper variant="ring" size="big" active={filter === option.value}>
                                {option.label}
                            </IconWrapper>
                        </button>
                    ))}
                    {unreadCount > 0 && projectId && (
                        <button
                            type="button"
                            onClick={() => mark_read({ scope: "project", projectId })}
                            className="ml-auto cursor-pointer rounded-md px-1.5 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="shrink-0 p-2">
                    <NotificationSearch value={query} onChange={setQuery} />
                </div>

                <NotificationFeed
                    notifications={notifications}
                    loadedCount={feed.notifications.length}
                    query={query}
                    feedKey={`inbox:${projectId ?? ""}:${filter}`}
                    selectedId={selected?.id ?? null}
                    clickableRows="all"
                    className="min-h-0 flex-1 px-1.5 pb-2"
                    emptyTitle={
                        feed.accessDenied
                            ? "No access to this project"
                            : query.trim()
                              ? "No matches"
                              : "You're all caught up"
                    }
                    emptySubtitle={
                        feed.accessDenied
                            ? "You no longer have access to this project's inbox."
                            : query.trim()
                              ? `Nothing matches “${query.trim()}”.`
                              : "Assignments and mentions for this project land here."
                    }
                    headerClassName="bg-charcoal/70 backdrop-blur-sm"
                    loading={feed.isLoading}
                    error={feed.isError}
                    pageError={Boolean(feed.error) && notifications.length > 0}
                    hasNextPage={Boolean(feed.hasNextPage)}
                    fetchingNextPage={feed.isFetchingNextPage}
                    onLoadMore={() => void feed.fetchNextPage()}
                    onRetry={() => void feed.refetch()}
                    onSelect={open}
                />
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <InboxDetail notification={selected} />
            </div>
        </div>
    );
}
