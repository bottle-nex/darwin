"use client";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { useBoardLaneModel } from "@/hooks/issues/useBoard";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import type { BoardLaneSelector } from "@/types/board";

export default function BoardLanePagination({ selector }: { selector: BoardLaneSelector }) {
    const projectId = useActiveProject()?.id;
    const lane = useBoardLaneModel(projectId, selector);
    const paginationTargetRef = useRef<HTMLDivElement | null>(null);
    const boardDragActive = useKanbanBoardStore((state) => state.overlayActive);
    const customDragActive = useCustomKanbanStore((state) => state.overlayActive);
    const dragActive = boardDragActive || customDragActive;
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
        if (!target || !hasNextPage || fetchingNextPage || pageError || dragActive) return;
        const root = target.closest<HTMLElement>("[data-lenis-prevent]");
        if (!root) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) void fetchNextPage();
            },
            { root, rootMargin: "0px 0px 780px 0px" },
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [dragActive, fetchNextPage, fetchingNextPage, hasNextPage, pageError]);

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
                <Button
                    size="xs"
                    variant="tertiary"
                    disabled={dragActive}
                    onClick={() => retryPage()}
                >
                    {fallbackPagination ? "Retry search" : "Retry lane"}
                </Button>
            )}
        </div>
    );
}
