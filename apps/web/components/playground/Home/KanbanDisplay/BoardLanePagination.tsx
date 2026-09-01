"use client";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { useBoardLaneModel } from "@/hooks/issues/useBoard";
import { useActiveProject } from "@/hooks/useActiveProject";
import type { BoardLaneSelector } from "@/types/board";

export default function BoardLanePagination({ selector }: { selector: BoardLaneSelector }) {
    const projectId = useActiveProject()?.id;
    const lane = useBoardLaneModel(projectId, selector);
    const paginationTargetRef = useRef<HTMLDivElement | null>(null);
    const fallbackPagination = lane.source === "fallback";
    const hasNextPage = Boolean(
        fallbackPagination ? lane.hasNextFallbackPage : lane.hasNextBasePage,
    );
    const fetchingNextPage = fallbackPagination
        ? lane.isFetchingNextFallbackPage
        : lane.isFetchingNextBasePage;
    const pageError = fallbackPagination
        ? lane.fallbackError
        : lane.laneError || lane.basePageError;
    const fetchNextPage = fallbackPagination ? lane.fetchNextFallbackPage : lane.fetchNextBasePage;
    const retryPage = fallbackPagination ? lane.retryFallback : lane.retryBasePage;

    useEffect(() => {
        const target = paginationTargetRef.current;
        if (!target || !hasNextPage || fetchingNextPage || pageError) return;
        // Inside a list the pane's own scroller is the root; on a board the loaders
        // sit under the columns, where the viewport is what tells us they are reached.
        const root = target.closest<HTMLElement>("[data-lenis-prevent]");
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) void fetchNextPage();
            },
            { root, rootMargin: "0px 0px 780px 0px" },
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [fetchNextPage, fetchingNextPage, hasNextPage, pageError]);

    return (
        <div
            ref={paginationTargetRef}
            className={
                pageError
                    ? "flex shrink-0 justify-end px-1 pt-2"
                    : "h-px w-full shrink-0 overflow-hidden"
            }
        >
            {pageError && (
                <Button size="xs" variant="tertiary" onClick={() => retryPage()}>
                    {fallbackPagination ? "Retry search" : "Retry lane"}
                </Button>
            )}
        </div>
    );
}
