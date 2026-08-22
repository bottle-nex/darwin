"use client";

import { useMemo, type ReactNode } from "react";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import LogoLoader from "@/components/app/LogoLoader";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import { VirtualizedRows } from "@/components/playground/Home/KanbanDisplay/VirtualizedRows";
import { flattenGroupedIssueRows } from "@/components/playground/Home/KanbanDisplay/virtualizedIssueRows";
import { IssueSelectionOrderProvider } from "@/hooks/issues/useIssueSelection";
import { cn } from "@/lib/utils";
import type {
    MyIssuesGroup,
    MyIssuesOrder,
    MyIssuesView,
} from "@/store/issues/useMyIssuesOptionsStore";
import type { BoardIssue } from "@/types/board";
import MyIssueRow from "./MyIssueRow";
import { groupIssues } from "./myIssues";

type MyIssuesListProps = {
    issues: BoardIssue[];
    total: number;
    projectName: string;
    view: MyIssuesView;
    groupBy: MyIssuesGroup;
    orderBy: MyIssuesOrder;
    loading: boolean;
    error: boolean;
    pageError: boolean;
    filtersActive: boolean;
    onClearFilters: () => void;
    onRetry: () => void;
    hasNextPage: boolean;
    fetchingNextPage: boolean;
    onLoadMore: () => void;
};

export default function MyIssuesList({
    issues,
    total,
    projectName,
    view,
    groupBy,
    orderBy,
    loading,
    error,
    pageError,
    filtersActive,
    onClearFilters,
    onRetry,
    hasNextPage,
    fetchingNextPage,
    onLoadMore,
}: MyIssuesListProps) {
    const groups = useMemo(() => groupIssues(issues, groupBy, orderBy), [issues, groupBy, orderBy]);
    const rows = useMemo(() => flattenGroupedIssueRows(groups, (issue) => issue.id), [groups]);
    const loadedIssueIds = useMemo(() => issues.map((issue) => issue.id), [issues]);
    const issuePositions = useMemo(
        () => new Map(loadedIssueIds.map((issueId, index) => [issueId, index + 1])),
        [loadedIssueIds],
    );
    const issueRows = useMemo(() => {
        const indexes = new Map<string, number>();
        rows.forEach((row, index) => {
            if (row.kind === "issue") indexes.set(row.issue.id, index);
        });
        return indexes;
    }, [rows]);
    const emptyState = resolveEmptyState({
        loading,
        error,
        filtersActive,
        view,
        onClearFilters,
        onRetry,
    });

    return (
        <IssueSelectionOrderProvider issueIds={loadedIssueIds}>
            <VirtualizedRows
                rows={rows}
                getRowKey={(row) => row.key}
                estimateSize={43}
                className="min-h-0 flex-1 px-4 py-2"
                contentRole="list"
                findIssueRow={(issueId) => issueRows.get(issueId) ?? -1}
                emptyState={emptyState}
                footer={
                    issues.length > 0 ? (
                        <div className="flex justify-center py-3">
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
                                    {fetchingNextPage ? "Loading…" : "Load more issues"}
                                </Button>
                            ) : (
                                <span className="text-[11px] text-neutral-600">
                                    All loaded issues are shown
                                </span>
                            )}
                        </div>
                    ) : undefined
                }
                status={{
                    label: loading
                        ? "Loading your issues"
                        : error || pageError
                          ? "Your issues could not be loaded. Retry is available."
                          : issues.length === 0
                            ? filtersActive
                                ? "No loaded issues match your filters"
                                : "No issues to show"
                            : `${issues.length} of ${total} issues loaded`,
                }}
                autoFill={{
                    key: `${view}:${groupBy}:${orderBy}:${filtersActive}`,
                    hasNextPage,
                    fetchingNextPage,
                    pageError,
                    paused: false,
                    onLoadMore,
                }}
                renderRow={(row) => {
                    if (row.kind === "group") {
                        if (groupBy === "none") return <div aria-hidden />;
                        return (
                            <div className="flex items-center gap-2 px-2 py-2 text-[12px] font-medium text-neutral-300">
                                <row.group.icon
                                    className={cn("size-3.5", row.group.iconClassName)}
                                    aria-hidden
                                />
                                <span>{row.group.label}</span>
                                <span className="text-neutral-600">{row.group.issues.length}</span>
                            </div>
                        );
                    }
                    if (row.kind === "group-end") return null;
                    return (
                        <div
                            role="listitem"
                            aria-posinset={issuePositions.get(row.issue.id)}
                            aria-setsize={total}
                            className="overflow-hidden rounded-lg ring-1 ring-white/7"
                        >
                            <MyIssueRow issue={row.issue} projectName={projectName} />
                        </div>
                    );
                }}
            />
        </IssueSelectionOrderProvider>
    );
}

function resolveEmptyState({
    loading,
    error,
    filtersActive,
    view,
    onClearFilters,
    onRetry,
}: {
    loading: boolean;
    error: boolean;
    filtersActive: boolean;
    view: MyIssuesView;
    onClearFilters: () => void;
    onRetry: () => void;
}): ReactNode {
    if (loading) return <LogoLoader size={32} className="py-16" />;
    if (error) {
        return (
            <div className="flex min-h-64 flex-col justify-center">
                <PaneEmptyState
                    icon={HiOutlineClipboardDocumentList}
                    title="Couldn’t load your issues"
                    subtitle="Try again in a moment."
                >
                    <Button variant="tertiary" size="sm" onClick={onRetry}>
                        Retry
                    </Button>
                </PaneEmptyState>
            </div>
        );
    }
    return (
        <div className="flex min-h-64 flex-col justify-center">
            <PaneEmptyState
                icon={HiOutlineClipboardDocumentList}
                title={
                    filtersActive
                        ? "No issues match your filters"
                        : view === "assigned"
                          ? "No issues assigned to you"
                          : "You haven’t created any issues"
                }
                subtitle={
                    filtersActive
                        ? "Adjust or clear the board filters to see more issues."
                        : view === "assigned"
                          ? "Issues assigned to you will appear here."
                          : "Issues you file will appear here."
                }
            >
                {filtersActive && (
                    <Button variant="tertiary" size="sm" onClick={onClearFilters}>
                        Clear filters
                    </Button>
                )}
            </PaneEmptyState>
        </div>
    );
}
