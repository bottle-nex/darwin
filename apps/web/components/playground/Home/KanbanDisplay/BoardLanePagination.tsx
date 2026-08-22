"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoardLaneModel } from "@/hooks/issues/useBoard";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import type { BoardLaneSelector } from "@/types/board";

export type BoardLaneModel = ReturnType<typeof useBoardLaneModel>;

export default function BoardLanePagination({ selector }: { selector: BoardLaneSelector }) {
    const projectId = useActiveProject()?.id;
    const lane = useBoardLaneModel(projectId, selector);

    return <BoardLanePaginationView lane={lane} autoLoadWhenVisible />;
}

export function BoardLanePaginationView({
    lane,
    autoLoadWhenVisible = false,
}: {
    lane: BoardLaneModel;
    autoLoadWhenVisible?: boolean;
}) {
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
    const hasRetry = lane.fallbackError || lane.laneError || lane.basePageError;

    useEffect(() => {
        const target = paginationTargetRef.current;
        if (
            !target ||
            !autoLoadWhenVisible ||
            !hasNextPage ||
            fetchingNextPage ||
            pageError ||
            dragActive
        ) {
            return;
        }
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
    }, [autoLoadWhenVisible, dragActive, fetchNextPage, fetchingNextPage, hasNextPage, pageError]);

    return (
        <div
            ref={paginationTargetRef}
            className={
                hasRetry
                    ? "flex shrink-0 justify-end px-1 pt-2"
                    : "h-px w-full shrink-0 overflow-hidden"
            }
        >
            {hasRetry ? (
                <div className="flex items-center gap-1">
                    {lane.fallbackError && (
                        <Button
                            size="xs"
                            variant="tertiary"
                            disabled={dragActive}
                            onClick={() => lane.retryFallback()}
                        >
                            Retry search
                        </Button>
                    )}
                    {(lane.laneError || lane.basePageError) && (
                        <Button
                            size="xs"
                            variant="tertiary"
                            disabled={dragActive}
                            onClick={() => lane.retryBasePage()}
                        >
                            Retry lane
                        </Button>
                    )}
                </div>
            ) : null}
        </div>
    );
}
