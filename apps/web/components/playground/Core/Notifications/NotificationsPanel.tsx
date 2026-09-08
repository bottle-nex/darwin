"use client";
import { CloseIcon } from "@trydarwin/ui/icons";
import { useState } from "react";

import { PANE_TOP_BAR_HEIGHT } from "@/components/playground/Core/components/PlaygroundPaneFrame";
import { BLURRED_BG_PANEL } from "@/components/playground/Home/KanbanDisplay/cardStyles";
import { useMarkNotificationsRead } from "@/hooks/notifications/useMarkNotificationsRead";
import { useMemberNotifications } from "@/hooks/notifications/useMemberNotifications";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { cn } from "@/lib/utils";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";

import NotificationFeed from "./NotificationFeed";
import NotificationSearch from "./NotificationSearch";
import { useSelectNotification } from "./useSelectNotification";

const PANEL_WIDTH = 352;
const PANEL_GUTTER = 6;

export default function NotificationsPanel() {
    const { isOpen, close } = useNotificationsPanelStore();
    const [query, setQuery] = useState<string>("");
    const feed = useMemberNotifications();
    const unreadCount = feed.unreadCount;
    const { mutate: mark_read } = useMarkNotificationsRead();
    const select = useSelectNotification();
    const glass = useUserConfig().backgroundLightingEnabled;

    return (
        <aside
            aria-label="Notifications"
            inert={!isOpen}
            style={{ width: isOpen ? PANEL_WIDTH : 0 }}
            className="h-full min-h-0 shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        >
            <div
                style={{ width: PANEL_WIDTH - PANEL_GUTTER, marginLeft: PANEL_GUTTER }}
                className={cn(
                    "relative flex h-full flex-col rounded-lg border-[1.5px] border-snow/5",
                    BLURRED_BG_PANEL(glass),
                )}
            >
                <header
                    style={{ height: PANE_TOP_BAR_HEIGHT }}
                    className="flex shrink-0 items-center gap-2 pr-1.5 pl-3"
                >
                    <h2 className="text-[14px] font-medium text-neutral-100">Notifications</h2>
                    {unreadCount > 0 && (
                        <span className="rounded-full bg-white/7 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300 tabular-nums">
                            {unreadCount}
                        </span>
                    )}
                    <div className="ml-auto flex items-center gap-0.5">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => mark_read({ scope: "member" })}
                                className="cursor-pointer rounded-md px-1.5 py-1 text-[11px] text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
                            >
                                Mark all read
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={close}
                            aria-label="Close notifications"
                            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
                        >
                            <CloseIcon className="size-4" aria-hidden />
                        </button>
                    </div>
                </header>

                <div className="shrink-0 px-2">
                    <NotificationSearch value={query} onChange={setQuery} />
                </div>

                <NotificationFeed
                    notifications={feed.notifications}
                    loadedCount={feed.notifications.length}
                    query={query}
                    feedKey="member"
                    clickableRows="navigable"
                    className="min-h-0 flex-1 px-1.5 pb-2"
                    emptyTitle={query.trim() ? "No matches" : "You're all caught up"}
                    emptySubtitle={
                        query.trim()
                            ? `Nothing matches “${query.trim()}”.`
                            : "Team and role changes will show up here."
                    }
                    headerClassName={glass ? "bg-charcoal/70 backdrop-blur-sm" : "bg-charcoal"}
                    loading={feed.isLoading}
                    error={feed.isError}
                    pageError={Boolean(feed.error) && feed.notifications.length > 0}
                    hasNextPage={Boolean(feed.hasNextPage)}
                    fetchingNextPage={feed.isFetchingNextPage}
                    onLoadMore={() => void feed.fetchNextPage()}
                    onRetry={() => void feed.refetch()}
                    onSelect={select}
                />
            </div>
        </aside>
    );
}
