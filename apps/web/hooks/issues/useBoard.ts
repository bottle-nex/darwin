"use client";

import {
    Fragment,
    createContext,
    createElement,
    useContext,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";
import {
    useInfiniteQuery,
    useQueries,
    useQuery,
    useQueryClient,
    type InfiniteData,
    type QueryClient,
} from "@tanstack/react-query";
import type { CursorPage, Issue } from "@trymatcha/types";
import { apiClient } from "@/lib/axios";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import {
    BOARD_QUERY_KEY,
    boardIssueBelongsToLane,
    boardIssueMatchesFilters,
    boardLanePageLimit,
    boardLaneForIssue,
    boardLaneKey,
    boardOverlayKey,
    boardSearchKey,
    flattenBoardLanePages,
    mergeBoardLaneRows,
    normalizeBoardFilters,
    patchBoardIssueCaches,
    pruneBoardOverlayRows,
    resolveBoardFilterFallback,
} from "./boardCache";
import { useBoardColumns } from "./useBoardColumns";
import { BOARD_SEARCH_URL, BOARD_URL } from "@/routes/api_routes";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import type { ApiResponse } from "@/types/api";
import type { BoardFilters } from "@/types/boardFilter";
import type { BoardIssue, BoardIssuePage, BoardLaneSelector } from "@/types/board";

export { BOARD_QUERY_KEY };

const COLLECTION_PAGE_LIMIT = 50;

function laneParams(selector: BoardLaneSelector, cursor: string | null) {
    return selector.type === "system"
        ? {
              lane_type: "system",
              status: selector.status,
              cursor: cursor ?? undefined,
              limit: boardLanePageLimit(cursor),
          }
        : {
              lane_type: "custom",
              column_id: selector.columnId,
              cursor: cursor ?? undefined,
              limit: boardLanePageLimit(cursor),
          };
}

export function useBoardLane(projectId: string | undefined, selector: BoardLaneSelector) {
    return useInfiniteQuery({
        queryKey: boardLaneKey(projectId ?? "", selector),
        enabled: Boolean(projectId),
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam, signal }) => {
            const response = await apiClient.get<ApiResponse<BoardIssuePage>>(
                BOARD_URL(projectId!),
                {
                    params: laneParams(selector, pageParam),
                    signal,
                },
            );
            return response.data.data;
        },
        getNextPageParam: (page) => page.nextCursor ?? undefined,
    });
}

function useLoadedBoardRows(projectId: string | undefined) {
    const metadataQuery = useBoardColumns(projectId);
    const metadata = metadataQuery.data;
    const selectors = useMemo<BoardLaneSelector[]>(
        () => [
            ...KanbanBoard.STATUSES.map((status) => ({ type: "system", status }) as const),
            ...(metadata?.columns.map((column) => ({
                type: "custom" as const,
                columnId: column.id,
            })) ?? []),
        ],
        [metadata?.columns],
    );
    const queries = useQueries({
        queries: selectors.map((selector) => ({
            queryKey: boardLaneKey(projectId ?? "", selector),
            enabled: false,
        })),
    });
    const overlayQuery = useQuery({
        queryKey: boardOverlayKey(projectId ?? ""),
        enabled: false,
        initialData: [] as BoardIssue[],
    });
    const overlays = useMemo(() => overlayQuery.data ?? [], [overlayQuery.data]);
    const rows = useMemo(
        () =>
            selectors.flatMap((selector, index) => {
                const data = queries[index]?.data as
                    InfiniteData<CursorPage<BoardIssue>, string | null> | undefined;
                return data
                    ? mergeBoardLaneRows(data.pages, selector, overlays)
                    : overlays.filter((row) => boardIssueBelongsToLane(row, selector));
            }),
        [selectors, queries, overlays],
    );

    return {
        rows,
        baseSettled:
            metadataQuery.isSuccess &&
            selectors.length > 0 &&
            queries.every((query) => query.isSuccess),
        basePending: metadataQuery.isPending || queries.some((query) => query.isPending),
        baseError: metadataQuery.isError || queries.some((query) => query.isError),
    };
}

export function useBoardSearch(
    projectId: string | undefined,
    filters: BoardFilters,
    enabled: boolean,
) {
    const normalized = normalizeBoardFilters(filters);
    return useInfiniteQuery({
        queryKey: boardSearchKey(projectId ?? "", normalized),
        enabled: Boolean(projectId) && enabled,
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam, signal }) => {
            const response = await apiClient.get<ApiResponse<BoardIssuePage>>(
                BOARD_SEARCH_URL(projectId!),
                {
                    params: {
                        filters: JSON.stringify(normalized),
                        cursor: pageParam ?? undefined,
                        limit: COLLECTION_PAGE_LIMIT,
                    },
                    signal,
                },
            );
            return response.data.data;
        },
        getNextPageParam: (page) => page.nextCursor ?? undefined,
    });
}

function useBoardFeedValue(projectId: string | undefined) {
    const filters = useKanbanFilterStore((state) => state.filters);
    const loaded = useLoadedBoardRows(projectId);
    const fallbackDecision = useMemo(
        () => resolveBoardFilterFallback(loaded.rows, filters, loaded.baseSettled),
        [loaded.rows, filters, loaded.baseSettled],
    );
    const fallback = useBoardSearch(projectId, filters, fallbackDecision.fallbackEnabled);
    const fallbackRows = useMemo(
        () => (fallback.data ? flattenBoardLanePages(fallback.data.pages) : []),
        [fallback.data],
    );
    const usesFallback = fallbackDecision.fallbackEnabled;

    return {
        ...loaded,
        baseRows: loaded.rows,
        filters,
        filtersActive: fallbackDecision.filtersActive,
        localRows: fallbackDecision.localRows,
        fallbackRows,
        rows: usesFallback ? fallbackRows : fallbackDecision.localRows,
        source: usesFallback
            ? ("fallback" as const)
            : fallbackDecision.filtersActive
              ? ("local" as const)
              : ("base" as const),
        fallbackEnabled: usesFallback,
        fallbackPending: usesFallback && fallback.isPending,
        fallbackError: usesFallback && fallback.isError,
        fallbackEmpty: usesFallback && fallback.isSuccess && fallbackRows.length === 0,
        retryFallback: fallback.refetch,
        fetchNextFallbackPage: fallback.fetchNextPage,
        hasNextFallbackPage: fallback.hasNextPage,
        isFetchingNextFallbackPage: fallback.isFetchingNextPage,
    };
}

type BoardFeedContextValue = {
    projectId: string | undefined;
    feed: ReturnType<typeof useBoardFeedValue>;
};

const BoardFeedContext = createContext<BoardFeedContextValue | null>(null);

export function BoardFeedProvider({
    projectId,
    children,
}: {
    projectId: string | undefined;
    children: ReactNode;
}) {
    const feed = useBoardFeedValue(projectId);
    const value = useMemo(() => ({ projectId, feed }), [projectId, feed]);
    return createElement(BoardFeedContext.Provider, { value }, children);
}

export function useBoardFeed(projectId: string | undefined) {
    const context = useContext(BoardFeedContext);
    if (!context || context.projectId !== projectId) {
        throw new Error("BoardFeedProvider is missing for this project");
    }
    return context.feed;
}

export function useBoardLaneModel(projectId: string | undefined, selector: BoardLaneSelector) {
    const lane = useBoardLane(projectId, selector);
    const feed = useBoardFeed(projectId);
    const { data: metadata } = useBoardColumns(projectId);
    const baseRows = feed.baseRows.filter((row) => boardIssueBelongsToLane(row, selector));
    const rows = feed.rows.filter((row) => boardIssueBelongsToLane(row, selector));
    const matchedLoaded = feed.filtersActive
        ? baseRows.filter((row) => boardIssueMatchesFilters(row, feed.filters)).length
        : baseRows.length;
    const serverTotal =
        selector.type === "system"
            ? (metadata?.totals.system[selector.status] ?? 0)
            : (metadata?.totals.custom[selector.columnId] ?? 0);

    return {
        ...feed,
        rows,
        loadedTotal: baseRows.length,
        matchedLoaded,
        serverTotal,
        hasNextBasePage: lane.hasNextPage,
        lanePending: lane.isPending,
        laneError: lane.isError,
        isFetchingNextBasePage: lane.isFetchingNextPage,
        fetchNextBasePage: lane.fetchNextPage,
        basePageError: lane.isFetchNextPageError,
        retryBasePage: lane.refetch,
    };
}

function BoardLaneLoader({
    projectId,
    selector,
}: {
    projectId: string;
    selector: BoardLaneSelector;
}) {
    const lane = useBoardLane(projectId, selector);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!lane.data) return;
        queryClient.setQueryData<BoardIssue[]>(boardOverlayKey(projectId), (overlays = []) =>
            pruneBoardOverlayRows(overlays, lane.data.pages),
        );
    }, [lane.data, projectId, queryClient]);
    return null;
}

export function BoardDataLoader({ projectId }: { projectId: string | undefined }) {
    const { data: metadata } = useBoardColumns(projectId);
    if (!projectId) return null;
    const lanes = [
        ...KanbanBoard.STATUSES.map((status) => ({ type: "system", status }) as const),
        ...(metadata?.columns.map((column) => ({
            type: "custom" as const,
            columnId: column.id,
        })) ?? []),
    ];

    return createElement(
        Fragment,
        null,
        ...lanes.map((selector) =>
            createElement(BoardLaneLoader, {
                key:
                    selector.type === "system"
                        ? `system:${selector.status}`
                        : `custom:${selector.columnId}`,
                projectId,
                selector,
            }),
        ),
    );
}

export function upsertBoardIssue(queryClient: QueryClient, projectId: string, issue: Issue) {
    patchBoardIssueCaches(queryClient, projectId, issue, { created: true });
}

export function updateBoardIssue(
    queryClient: QueryClient,
    projectId: string,
    issue: Issue,
    previous?: Pick<Issue, "status" | "customColumnId">,
) {
    patchBoardIssueCaches(queryClient, projectId, issue, {
        beforeLane: previous ? boardLaneForIssue(previous) : undefined,
    });
}
