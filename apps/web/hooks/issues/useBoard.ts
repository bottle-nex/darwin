"use client";

import {
    type InfiniteData,
    type QueryClient,
    useInfiniteQuery,
    useQueries,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import type { CursorPage, Issue } from "@trymatcha/types";
import {
    createContext,
    createElement,
    Fragment,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
} from "react";

import { apiClient } from "@/lib/axios";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { BOARD_SEARCH_URL, BOARD_URL } from "@/routes/api_routes";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import type { ApiResponse } from "@/types/api";
import type { BoardIssue, BoardIssuePage, BoardLaneSelector, BoardScope } from "@/types/board";
import type { BoardFilters } from "@/types/boardFilter";

import {
    BOARD_QUERY_KEY,
    boardIssueBelongsToLane,
    boardIssueMatchesFilters,
    boardLaneForIssue,
    boardLaneKey,
    boardLanePageLimit,
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

async function fetchBoardLanePage(
    projectId: string,
    selector: BoardLaneSelector,
    cursor: string | null,
    signal?: AbortSignal,
) {
    const response = await apiClient.get<ApiResponse<BoardIssuePage>>(BOARD_URL(projectId), {
        params: laneParams(selector, cursor),
        signal,
    });
    return response.data.data;
}

export function useBoardLane(projectId: string | undefined, selector: BoardLaneSelector) {
    return useInfiniteQuery({
        queryKey: boardLaneKey(projectId ?? "", selector),
        enabled: Boolean(projectId),
        initialPageParam: null as string | null,
        queryFn: ({ pageParam, signal }) =>
            fetchBoardLanePage(projectId!, selector, pageParam, signal),
        getNextPageParam: (page) => page.nextCursor ?? undefined,
    });
}

/**
 * The lanes one pane actually shows. Board metadata stays project-wide, but the
 * fan-out below opens one infinite query per lane — so an unscoped list would
 * load every column of every space on mount.
 */
function laneSelectorsFor(
    scope: BoardScope,
    columns: { id: string; spaceId: string }[] | undefined,
): BoardLaneSelector[] {
    if (scope.kind === "agent") {
        return KanbanBoard.STATUSES.map((status) => ({ type: "system", status }) as const);
    }
    return (columns ?? [])
        .filter((column) => column.spaceId === scope.spaceId)
        .map((column) => ({ type: "custom" as const, columnId: column.id }));
}

function useLoadedBoardRows(projectId: string | undefined, scope: BoardScope) {
    const metadataQuery = useBoardColumns(projectId);
    const metadata = metadataQuery.data;
    const selectors = useMemo<BoardLaneSelector[]>(
        () => laneSelectorsFor(scope, metadata?.columns),
        [scope, metadata?.columns],
    );
    const queryClient = useQueryClient();
    const queries = useQueries({
        queries: selectors.map((selector) => ({
            queryKey: boardLaneKey(projectId ?? "", selector),
            enabled: false,
            queryFn: (): Promise<unknown> => fetchBoardLanePage(projectId ?? "", selector, null),
        })),
    });
    const overlayKey = boardOverlayKey(projectId ?? "");
    const overlayQuery = useQuery({
        queryKey: overlayKey,
        enabled: false,
        initialData: [] as BoardIssue[],
        queryFn: () => queryClient.getQueryData<BoardIssue[]>(overlayKey) ?? [],
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

function useBoardFeedValue(projectId: string | undefined, scope: BoardScope) {
    const filters = useKanbanFilterStore((state) => state.filters);
    const loaded = useLoadedBoardRows(projectId, scope);
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
        scope,
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
    scope,
    children,
}: {
    projectId: string | undefined;
    scope: BoardScope;
    children: ReactNode;
}) {
    const feed = useBoardFeedValue(projectId, scope);
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

export function BoardDataLoader({
    projectId,
    scope,
}: {
    projectId: string | undefined;
    scope: BoardScope;
}) {
    const { data: metadata } = useBoardColumns(projectId);
    if (!projectId) return null;
    const lanes = laneSelectorsFor(scope, metadata?.columns);

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
