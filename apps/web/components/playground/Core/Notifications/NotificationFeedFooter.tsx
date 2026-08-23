"use client";
import { Button } from "@/components/ui/button";

export default function NotificationFeedFooter({
    loadedCount,
    searching,
    pageError,
    hasNextPage,
    fetchingNextPage,
    onLoadMore,
    onRetry,
}: {
    loadedCount: number;
    searching: boolean;
    pageError: boolean;
    hasNextPage: boolean;
    fetchingNextPage: boolean;
    onLoadMore: () => void;
    onRetry: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-1 py-3">
            {pageError ? (
                <Button variant="tertiary" size="sm" onClick={onRetry}>
                    Retry loading more
                </Button>
            ) : hasNextPage ? (
                <Button
                    variant="tertiary"
                    size="sm"
                    disabled={fetchingNextPage}
                    onClick={onLoadMore}
                >
                    {fetchingNextPage ? "Loading…" : "Load more"}
                </Button>
            ) : (
                <span className="text-[11px] text-neutral-600">All notifications are shown</span>
            )}
            {searching && (
                <span className="text-[11px] text-neutral-600">
                    Search filters the {loadedCount} loaded notifications.
                </span>
            )}
        </div>
    );
}
