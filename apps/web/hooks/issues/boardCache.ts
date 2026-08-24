import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";
import { type CursorPage, type Issue, IssueStatus } from "@trymatcha/types";

import { hasActiveFilters, issueMatchesFilters } from "@/lib/kanban/boardFilter";
import { removeInfinitePageItem, updateInfinitePageItem } from "@/lib/pagination/infinitePages";
import type {
    BoardIssue,
    BoardLane,
    BoardLaneSelector,
    BoardMetadata,
    BoardSearchKey,
} from "@/types/board";
import type { BoardFilters, DateRangeFilter } from "@/types/boardFilter";

export const BOARD_QUERY_KEY = ["board"] as const;
export const BOARD_COLUMNS_QUERY_KEY = [...BOARD_QUERY_KEY, "columns"] as const;
export const BOARD_LANE_QUERY_KEY = [...BOARD_QUERY_KEY, "lane"] as const;
export const BOARD_SEARCH_QUERY_KEY = [...BOARD_QUERY_KEY, "search"] as const;
export const BOARD_OVERLAY_QUERY_KEY = [...BOARD_QUERY_KEY, "overlay"] as const;
export const ISSUE_QUERY_KEY = ["issue"] as const;
export const MY_ISSUES_QUERY_KEY = ["my-issues"] as const;

export function boardLanePageLimit(cursor: string | null) {
    return cursor ? 20 : 30;
}

type BoardInfiniteData = InfiniteData<CursorPage<BoardIssue>, string | null>;

function uniqueSorted<T extends string | number>(values: readonly T[]) {
    return [...new Set(values)].sort((left, right) => String(left).localeCompare(String(right)));
}

function normalizeDateRange(range: DateRangeFilter | null) {
    if (!range || (!range.from && !range.to)) return null;
    return { from: range.from ?? null, to: range.to ?? null };
}

export function normalizeBoardFilters(filters: BoardFilters): BoardFilters {
    return {
        statuses: uniqueSorted(filters.statuses),
        priorities: uniqueSorted(filters.priorities),
        assigneeIds: uniqueSorted(filters.assigneeIds),
        creatorIds: uniqueSorted(filters.creatorIds),
        tagIds: uniqueSorted(filters.tagIds),
        createdAt: normalizeDateRange(filters.createdAt),
        startDate: normalizeDateRange(filters.startDate),
        targetDate: normalizeDateRange(filters.targetDate),
        query: filters.query.trim(),
    };
}

export function serializeBoardFilters(filters: BoardFilters) {
    return JSON.stringify(normalizeBoardFilters(filters));
}

export function boardColumnsKey(projectId: string) {
    return [...BOARD_COLUMNS_QUERY_KEY, projectId] as const;
}

export function boardLaneKey(projectId: string, selector: BoardLaneSelector) {
    return selector.type === "system"
        ? ([...BOARD_LANE_QUERY_KEY, projectId, "system", selector.status] as const)
        : ([...BOARD_LANE_QUERY_KEY, projectId, "custom", selector.columnId] as const);
}

export function boardSearchKey(projectId: string, filters: BoardFilters) {
    const normalized = normalizeBoardFilters(filters);
    const key: BoardSearchKey = {
        filters: normalized,
        snapshot: serializeBoardFilters(normalized),
    };
    return [...BOARD_SEARCH_QUERY_KEY, projectId, key] as const;
}

export function boardOverlayKey(projectId: string) {
    return [...BOARD_OVERLAY_QUERY_KEY, projectId] as const;
}

export function issueKey(projectId: string, issueId: string) {
    return [...ISSUE_QUERY_KEY, projectId, issueId] as const;
}

export function myIssuesKey(
    projectId: string,
    view: string,
    group: string,
    order: string,
    filters: BoardFilters,
) {
    const normalized = normalizeBoardFilters(filters);
    return [
        ...MY_ISSUES_QUERY_KEY,
        projectId,
        { view, group, order, filters: normalized, snapshot: serializeBoardFilters(normalized) },
    ] as const;
}

function compareBoardIssues(left: BoardIssue, right: BoardIssue) {
    return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
        right.id.localeCompare(left.id)
    );
}

export function flattenBoardLanePages(pages: readonly CursorPage<BoardIssue>[]) {
    const rows = new Map<string, BoardIssue>();
    for (const page of pages) {
        for (const row of page.items) {
            if (!rows.has(row.id)) rows.set(row.id, row);
        }
    }
    return [...rows.values()].sort(compareBoardIssues);
}

export function boardLaneForIssue(issue: Pick<BoardIssue, "customColumnId" | "status">): BoardLane {
    return issue.customColumnId
        ? { type: "custom", columnId: issue.customColumnId }
        : { type: "system", status: issue.status };
}

function sameBoardLane(left: BoardLane, right: BoardLane) {
    return (
        left.type === right.type &&
        (left.type === "custom"
            ? right.type === "custom" && left.columnId === right.columnId
            : right.type === "system" && left.status === right.status)
    );
}

export function boardIssueBelongsToLane(issue: BoardIssue, selector: BoardLaneSelector) {
    return selector.type === "custom"
        ? issue.customColumnId === selector.columnId
        : issue.customColumnId === null && issue.status === selector.status;
}

export function boardIssueMatchesFilters(issue: BoardIssue, filters: BoardFilters) {
    return issueMatchesFilters(issue, filters, { skipStatus: issue.customColumnId !== null });
}

export function mergeBoardLaneRows(
    pages: readonly CursorPage<BoardIssue>[],
    selector: BoardLaneSelector,
    overlays: readonly BoardIssue[],
) {
    const baseRows = flattenBoardLanePages(pages);
    const baseIds = new Set(baseRows.map((row) => row.id));
    const overlayRows = new Map<string, BoardIssue>();
    for (const row of overlays) {
        if (!baseIds.has(row.id) && boardIssueBelongsToLane(row, selector)) {
            overlayRows.set(row.id, row);
        }
    }
    return [...baseRows, ...overlayRows.values()].sort(compareBoardIssues);
}

export function pruneBoardOverlayRows<T extends readonly BoardIssue[]>(
    overlays: T,
    pages: readonly CursorPage<BoardIssue>[],
): T | BoardIssue[] {
    const baseIds = new Set(pages.flatMap((page) => page.items.map((row) => row.id)));
    const remaining = overlays.filter((row) => !baseIds.has(row.id));
    return remaining.length === overlays.length ? overlays : remaining;
}

export function resolveBoardFilterFallback(
    loadedRows: readonly BoardIssue[],
    filters: BoardFilters,
    baseSettled: boolean,
) {
    const filtersActive = hasActiveFilters(filters);
    const localRows = filtersActive
        ? loadedRows.filter((row) => boardIssueMatchesFilters(row, filters))
        : [...loadedRows];
    return {
        filtersActive,
        localRows,
        fallbackEnabled: filtersActive && baseSettled && localRows.length === 0,
    };
}

export function patchBoardPageItem(data: BoardInfiniteData, issue: BoardIssue) {
    return updateInfinitePageItem(data, issue.id, () => issue);
}

export function removeBoardPageItem(data: BoardInfiniteData, issueId: string) {
    return removeInfinitePageItem(data, issueId);
}

function adjustFirstPageTotal(data: BoardInfiniteData, amount: number) {
    const firstPage = data.pages[0];
    if (!firstPage || firstPage.total === undefined) return data;
    const pages = data.pages.slice();
    pages[0] = {
        ...firstPage,
        total: Math.max(0, firstPage.total + amount),
    };
    return { ...data, pages };
}

function upsertBoardPageItem(data: BoardInfiniteData, issue: BoardIssue) {
    const updated = patchBoardPageItem(data, issue);
    if (
        updated !== data ||
        data.pages.some((page) => page.items.some((row) => row.id === issue.id))
    ) {
        return updated;
    }
    if (!data.pages.length) return data;
    const pages = data.pages.slice();
    pages[0] = { ...pages[0], items: [issue, ...pages[0].items] };
    return adjustFirstPageTotal({ ...data, pages }, 1);
}

function removeBoardPageItemWithTotal(data: BoardInfiniteData, issueId: string) {
    const contains = data.pages.some((page) => page.items.some((row) => row.id === issueId));
    const updated = removeBoardPageItem(data, issueId);
    return contains ? adjustFirstPageTotal(updated, -1) : updated;
}

export function toBoardIssue(issue: Issue | BoardIssue): BoardIssue {
    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        customColumnId: issue.customColumnId,
        createdAt: new Date(issue.createdAt).toISOString(),
        startDate: issue.startDate ? new Date(issue.startDate).toISOString() : null,
        targetDate: issue.targetDate ? new Date(issue.targetDate).toISOString() : null,
        prUrl: issue.prUrl,
        prNumber: issue.prNumber,
        prTitle: issue.prTitle,
        creator: issue.creator ?? null,
        assignees: issue.assignees,
        tags: issue.tags,
    };
}

function selectorFromLaneKey(queryKey: QueryKey): BoardLaneSelector | null {
    const laneType = queryKey[3];
    const value = queryKey[4];
    if (laneType === "system" && typeof value === "string") {
        return { type: "system", status: value as BoardIssue["status"] };
    }
    if (laneType === "custom" && typeof value === "string") {
        return { type: "custom", columnId: value };
    }
    return null;
}

function findCachedIssue(queryClient: QueryClient, projectId: string, issueId: string) {
    for (const query of queryClient.getQueryCache().findAll({
        queryKey: [...BOARD_LANE_QUERY_KEY, projectId],
    })) {
        const data = query.state.data as BoardInfiniteData | undefined;
        const row = data?.pages.flatMap((page) => page.items).find((item) => item.id === issueId);
        if (row) return row;
    }
    const overlay = queryClient
        .getQueryData<BoardIssue[]>(boardOverlayKey(projectId))
        ?.find((row) => row.id === issueId);
    if (overlay) return overlay;
    const targeted = queryClient.getQueryData<BoardIssue>(issueKey(projectId, issueId));
    if (targeted) return targeted;
    for (const prefix of [
        [...BOARD_SEARCH_QUERY_KEY, projectId],
        [...MY_ISSUES_QUERY_KEY, projectId],
    ]) {
        for (const query of queryClient.getQueryCache().findAll({ queryKey: prefix })) {
            const data = query.state.data as BoardInfiniteData | undefined;
            const row = data?.pages
                .flatMap((page) => page.items)
                .find((item) => item.id === issueId);
            if (row) return row;
        }
    }
    return undefined;
}

function updateOverlay(
    queryClient: QueryClient,
    projectId: string,
    issueId: string,
    issue?: BoardIssue,
) {
    queryClient.setQueryData<BoardIssue[]>(boardOverlayKey(projectId), (current = []) => {
        const remaining = current.filter((row) => row.id !== issueId);
        return issue ? [...remaining, issue] : remaining;
    });
}

function adjustLaneTotal(metadata: BoardMetadata, lane: BoardLane, amount: number): BoardMetadata {
    if (lane.type === "custom") {
        return {
            ...metadata,
            totals: {
                ...metadata.totals,
                custom: {
                    ...metadata.totals.custom,
                    [lane.columnId]: Math.max(
                        0,
                        (metadata.totals.custom[lane.columnId] ?? 0) + amount,
                    ),
                },
            },
        };
    }
    return {
        ...metadata,
        totals: {
            ...metadata.totals,
            system: {
                ...metadata.totals.system,
                [lane.status]: Math.max(0, (metadata.totals.system[lane.status] ?? 0) + amount),
            },
        },
    };
}

function updateMetadataTotals(
    queryClient: QueryClient,
    projectId: string,
    beforeLane: BoardLane | undefined,
    afterLane: BoardLane | undefined,
) {
    if (beforeLane && afterLane && sameBoardLane(beforeLane, afterLane)) return;
    queryClient.setQueryData<BoardMetadata>(boardColumnsKey(projectId), (metadata) => {
        if (!metadata) return metadata;
        let next = metadata;
        if (beforeLane) next = adjustLaneTotal(next, beforeLane, -1);
        if (afterLane) next = adjustLaneTotal(next, afterLane, 1);
        return next;
    });
}

function patchSecondaryIssueCaches(queryClient: QueryClient, projectId: string, issue: BoardIssue) {
    queryClient.setQueryData<BoardIssue>(issueKey(projectId, issue.id), issue);

    for (const query of queryClient.getQueryCache().findAll({
        queryKey: [...BOARD_SEARCH_QUERY_KEY, projectId],
    })) {
        const search = query.queryKey[3] as BoardSearchKey | undefined;
        const data = query.state.data as BoardInfiniteData | undefined;
        if (!search || !data) continue;
        queryClient.setQueryData<BoardInfiniteData>(
            query.queryKey,
            boardIssueMatchesFilters(issue, search.filters)
                ? upsertBoardPageItem(data, issue)
                : removeBoardPageItemWithTotal(data, issue.id),
        );
    }

    for (const query of queryClient.getQueryCache().findAll({
        queryKey: [...MY_ISSUES_QUERY_KEY, projectId],
    })) {
        const options = query.queryKey[2] as
            { filters: BoardFilters; view: "assigned" | "created" } | undefined;
        const data = query.state.data as BoardInfiniteData | undefined;
        if (!options || !data) continue;
        const viewerId = query.meta?.viewerId;
        const relevant =
            typeof viewerId === "string" &&
            (options.view === "created"
                ? issue.creator?.id === viewerId
                : issue.assignees.some((assignee) => assignee.id === viewerId));
        queryClient.setQueryData<BoardInfiniteData>(
            query.queryKey,
            relevant && issueMatchesFilters(issue, options.filters)
                ? upsertBoardPageItem(data, issue)
                : removeBoardPageItemWithTotal(data, issue.id),
        );
    }
}

export function patchBoardIssueCaches(
    queryClient: QueryClient,
    projectId: string,
    value: Issue | BoardIssue,
    options: { beforeLane?: BoardLane; created?: boolean } = {},
) {
    const issue = toBoardIssue(value);
    const cached = findCachedIssue(queryClient, projectId, issue.id);
    const cachedLane = cached ? boardLaneForIssue(cached) : undefined;
    const beforeLane = options.beforeLane ?? cachedLane;
    const afterLane = boardLaneForIssue(issue);
    const transitionAlreadyApplied = Boolean(
        options.beforeLane &&
        cachedLane &&
        sameBoardLane(cachedLane, afterLane) &&
        !sameBoardLane(options.beforeLane, afterLane),
    );
    if (!cached && !options.created && beforeLane && sameBoardLane(beforeLane, afterLane)) return;
    let destinationContainsIssue = false;

    for (const query of queryClient.getQueryCache().findAll({
        queryKey: [...BOARD_LANE_QUERY_KEY, projectId],
    })) {
        const selector = selectorFromLaneKey(query.queryKey);
        const data = query.state.data as BoardInfiniteData | undefined;
        if (!selector || !data) continue;
        if (
            boardIssueBelongsToLane(issue, selector) &&
            data.pages.some((page) => page.items.some((row) => row.id === issue.id))
        ) {
            destinationContainsIssue = true;
        }
        queryClient.setQueryData<BoardInfiniteData>(
            query.queryKey,
            boardIssueBelongsToLane(issue, selector)
                ? patchBoardPageItem(data, issue)
                : removeBoardPageItem(data, issue.id),
        );
    }

    updateOverlay(queryClient, projectId, issue.id, destinationContainsIssue ? undefined : issue);
    patchSecondaryIssueCaches(queryClient, projectId, issue);

    if ((options.created && !cached) || beforeLane) {
        updateMetadataTotals(
            queryClient,
            projectId,
            options.created && !cached ? undefined : beforeLane,
            transitionAlreadyApplied ? beforeLane : afterLane,
        );
    } else if (!cached) {
        queryClient.invalidateQueries({ queryKey: boardColumnsKey(projectId) });
    }
}

export function removeBoardIssueCaches(
    queryClient: QueryClient,
    projectId: string,
    issueId: string,
    beforeLane?: BoardLane,
) {
    const cached = findCachedIssue(queryClient, projectId, issueId);
    const resolvedBeforeLane = beforeLane ?? (cached ? boardLaneForIssue(cached) : undefined);

    for (const [prefix, adjustsTotal] of [
        [[...BOARD_LANE_QUERY_KEY, projectId], false],
        [[...BOARD_SEARCH_QUERY_KEY, projectId], true],
        [[...MY_ISSUES_QUERY_KEY, projectId], true],
    ] as const) {
        for (const query of queryClient.getQueryCache().findAll({ queryKey: prefix })) {
            const data = query.state.data as BoardInfiniteData | undefined;
            if (data) {
                queryClient.setQueryData<BoardInfiniteData>(
                    query.queryKey,
                    adjustsTotal
                        ? removeBoardPageItemWithTotal(data, issueId)
                        : removeBoardPageItem(data, issueId),
                );
            }
        }
    }

    queryClient.setQueryData<BoardIssue[]>(boardOverlayKey(projectId), (current = []) =>
        current.filter((row) => row.id !== issueId),
    );
    queryClient.removeQueries({ queryKey: issueKey(projectId, issueId), exact: true });
    if (resolvedBeforeLane) {
        updateMetadataTotals(queryClient, projectId, resolvedBeforeLane, undefined);
    } else {
        queryClient.invalidateQueries({ queryKey: boardColumnsKey(projectId) });
    }
}

export function moveBoardIssueCaches(
    queryClient: QueryClient,
    projectId: string,
    issueId: string,
    customColumnId: string | null,
) {
    const issue = findCachedIssue(queryClient, projectId, issueId);
    if (!issue) {
        queryClient.invalidateQueries({ queryKey: boardColumnsKey(projectId) });
        return;
    }
    patchBoardIssueCaches(
        queryClient,
        projectId,
        {
            ...issue,
            customColumnId,
            status:
                customColumnId !== null
                    ? IssueStatus.Parked
                    : issue.status === IssueStatus.Parked
                      ? IssueStatus.Todo
                      : issue.status,
        },
        { beforeLane: boardLaneForIssue(issue) },
    );
}

export function reconcileBoardProject(queryClient: QueryClient, projectId: string) {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: boardColumnsKey(projectId) }),
        queryClient.invalidateQueries({ queryKey: [...BOARD_LANE_QUERY_KEY, projectId] }),
        queryClient.invalidateQueries({ queryKey: [...BOARD_SEARCH_QUERY_KEY, projectId] }),
        queryClient.invalidateQueries({ queryKey: [...MY_ISSUES_QUERY_KEY, projectId] }),
    ]).then((result) => {
        queryClient.setQueryData<BoardIssue[]>(boardOverlayKey(projectId), []);
        return result;
    });
}
