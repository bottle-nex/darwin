"use client";

import { MyIssuesIcon } from "@trymatcha/ui/icons";
import { type ReactNode, useMemo, useState } from "react";

import LogoLoader from "@/components/app/LogoLoader";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import IssueListGroupHeader from "@/components/playground/Home/KanbanDisplay/IssueListGroupHeader";
import IssueListRow from "@/components/playground/Home/KanbanDisplay/IssueListRow";
import { flattenGroupedIssueRows } from "@/components/playground/Home/KanbanDisplay/virtualizedIssueRows";
import { VirtualizedRows } from "@/components/playground/Home/KanbanDisplay/VirtualizedRows";
import { Button } from "@/components/ui/button";
import { IssueSelectionOrderProvider } from "@/hooks/issues/useIssueSelection";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";
import type {
    MyIssuesGroup,
    MyIssuesOrder,
    MyIssuesView,
} from "@/store/issues/useMyIssuesOptionsStore";
import type { BoardIssue } from "@/types/board";

import { groupIssues } from "./myIssues";

type MyIssuesListProps = {
    issues: BoardIssue[];
    total: number;
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
    const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<Set<string>>(() => new Set());
    const groups = useMemo(() => groupIssues(issues, groupBy, orderBy), [issues, groupBy, orderBy]);
    const rows = useMemo(
        () => flattenGroupedIssueRows(groups, (issue) => issue.id, false, collapsedGroupKeys),
        [collapsedGroupKeys, groups],
    );
    const loadedIssueIds = useMemo(() => issues.map((issue) => issue.id), [issues]);
    const selectedIds = useIssueSelectionStore((s) => s.ids);
    // A group header between two issues is not a selected row, so a run of selected
    // rows never joins across one.
    const selectedAt = (index: number) => {
        const row = rows[index];
        return row?.kind === "issue" && selectedIds.includes(row.issue.id);
    };
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
    const stickyGroupRows = useMemo(
        () =>
            groupBy === "none"
                ? []
                : rows.flatMap((row, index) => (row.kind === "group" ? [index] : [])),
        [groupBy, rows],
    );
    const emptyState = resolveEmptyState({
        loading,
        error,
        filtersActive,
        view,
        onClearFilters,
        onRetry,
    });

    function toggleGroup(groupKey: string) {
        setCollapsedGroupKeys((current) => {
            const next = new Set(current);
            if (next.has(groupKey)) next.delete(groupKey);
            else next.add(groupKey);
            return next;
        });
    }

    return (
        <IssueSelectionOrderProvider issueIds={loadedIssueIds}>
            <VirtualizedRows
                rows={rows}
                getRowKey={(row) => row.key}
                estimateSize={44}
                className="mt-2 min-h-0 flex-1 px-3 pb-2"
                contentRole="list"
                findIssueRow={(issueId) => issueRows.get(issueId) ?? -1}
                stickyRowIndexes={stickyGroupRows}
                emptyState={emptyState}
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
                renderRow={(row, index) => {
                    if (row.kind === "group") {
                        if (groupBy === "none") return <div aria-hidden />;
                        return (
                            <div className="pb-1">
                                <IssueListGroupHeader
                                    title={row.group.label}
                                    icon={row.group.icon}
                                    iconClassName={row.group.iconClassName}
                                    count={row.group.issues.length}
                                    collapsed={collapsedGroupKeys.has(row.group.key)}
                                    onToggle={() => toggleGroup(row.group.key)}
                                />
                            </div>
                        );
                    }
                    if (row.kind === "group-end") return null;
                    return (
                        <div
                            role="listitem"
                            aria-posinset={issuePositions.get(row.issue.id)}
                            aria-setsize={total}
                            className="overflow-hidden"
                        >
                            <IssueListRow
                                issueId={row.issue.id}
                                number={`#${row.issue.number}`}
                                title={row.issue.title}
                                status={row.issue.status}
                                tags={row.issue.tags}
                                assignees={row.issue.assignees.map(KanbanMappers.toAssignee)}
                                createdAt={row.issue.createdAt}
                                boardIssue={row.issue}
                                selectionScope="my-issues"
                                joinedAbove={selectedAt(index - 1)}
                                joinedBelow={selectedAt(index + 1)}
                            />
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
                    icon={MyIssuesIcon}
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
                icon={MyIssuesIcon}
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
