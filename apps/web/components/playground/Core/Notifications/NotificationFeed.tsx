"use client";
import type { Notification } from "@trydarwin/types";

import { VirtualizedRows } from "@/components/playground/Home/KanbanDisplay/VirtualizedRows";

import NotificationDayHeader from "./NotificationDayHeader";
import NotificationFeedEmpty from "./NotificationFeedEmpty";
import NotificationFeedFooter from "./NotificationFeedFooter";
import NotificationFeedNotice from "./NotificationFeedNotice";
import NotificationRow from "./NotificationRow";
import { notification_target } from "./notificationView";
import { useNotificationFeedRows } from "./useNotificationFeedRows";

const ROW_ESTIMATE = 90;

export type NotificationFeedProps = {
    notifications: Notification[];
    loadedCount: number;
    query: string;
    feedKey: string;
    selectedId?: string | null;
    clickableRows: "navigable" | "all";
    headerClassName: string;
    className: string;
    emptyTitle: string;
    emptySubtitle: string;
    loading: boolean;
    error: boolean;
    pageError: boolean;
    hasNextPage: boolean;
    fetchingNextPage: boolean;
    onLoadMore: () => void;
    onRetry: () => void;
    onSelect: (notification: Notification) => void;
};

export default function NotificationFeed({
    notifications,
    loadedCount,
    query,
    feedKey,
    selectedId,
    clickableRows,
    headerClassName,
    className,
    emptyTitle,
    emptySubtitle,
    loading,
    error,
    pageError,
    hasNextPage,
    fetchingNextPage,
    onLoadMore,
    onRetry,
    onSelect,
}: NotificationFeedProps) {
    const { matched, rows, stickyRowIndexes } = useNotificationFeedRows(notifications, query);
    const searching = query.trim().length > 0;
    const firstPageFailed = error && loadedCount === 0;

    const emptyState = loading ? (
        <NotificationFeedNotice message="Loading notifications…" />
    ) : firstPageFailed ? (
        <NotificationFeedNotice message="Notifications couldn't be loaded." onRetry={onRetry} />
    ) : (
        <NotificationFeedEmpty title={emptyTitle} subtitle={emptySubtitle} />
    );

    return (
        <VirtualizedRows
            rows={rows}
            getRowKey={(row) => row.key}
            estimateSize={ROW_ESTIMATE}
            className={className}
            contentRole="list"
            stickyRowIndexes={stickyRowIndexes}
            emptyState={emptyState}
            footer={
                loadedCount > 0 || hasNextPage ? (
                    <NotificationFeedFooter
                        loadedCount={loadedCount}
                        searching={searching}
                        pageError={pageError}
                        hasNextPage={hasNextPage}
                        fetchingNextPage={fetchingNextPage}
                        onLoadMore={onLoadMore}
                        onRetry={onRetry}
                    />
                ) : undefined
            }
            status={{
                label: loading
                    ? "Loading notifications"
                    : firstPageFailed || pageError
                      ? "Notifications could not be loaded. Retry is available."
                      : matched.length === 0
                        ? searching
                            ? "No loaded notifications match your search"
                            : "No notifications to show"
                        : `${matched.length} of ${loadedCount} notifications loaded`,
            }}
            autoFill={{
                key: feedKey,
                hasNextPage,
                fetchingNextPage,
                pageError,
                paused: false,
                onLoadMore,
            }}
            renderRow={(row) =>
                row.kind === "day" ? (
                    <NotificationDayHeader label={row.label} className={headerClassName} />
                ) : (
                    <NotificationRow
                        notification={row.notification}
                        clickable={
                            clickableRows === "all" ||
                            notification_target(row.notification) !== null
                        }
                        selected={selectedId === row.notification.id}
                        onSelect={() => onSelect(row.notification)}
                    />
                )
            }
        />
    );
}
