"use client";

import { MyIssuesIcon } from "@trymatcha/ui/icons";
import type { ReactNode } from "react";

import LogoLoader from "@/components/app/LogoLoader";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import GroupedIssueBoard from "@/components/playground/Home/KanbanDisplay/GroupedIssueBoard";
import GroupedIssueList from "@/components/playground/Home/KanbanDisplay/GroupedIssueList";
import { Button } from "@/components/ui/button";
import type { IssueLayout } from "@/hooks/issues/useIssueView";
import { type IssueGroupBy, NO_GROUPING } from "@/lib/kanban/issueGrouping";
import type { MyIssuesView } from "@/store/issues/useMyIssuesOptionsStore";
import type { BoardIssue } from "@/types/board";

type MyIssuesListProps = {
    issues: BoardIssue[];
    total: number;
    view: MyIssuesView;
    layout: IssueLayout;
    groupBy: IssueGroupBy;
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
    layout,
    groupBy,
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
    const emptyState = resolveEmptyState({
        loading,
        error,
        filtersActive,
        view,
        onClearFilters,
        onRetry,
    });

    const autoFill = {
        key: `${view}:${filtersActive}`,
        hasNextPage,
        fetchingNextPage,
        pageError,
        paused: false,
        onLoadMore,
    };

    if (layout === "board") {
        return (
            <GroupedIssueBoard
                issues={issues}
                groupBy={groupBy === NO_GROUPING ? "statuses" : groupBy}
                selectionScope="my-issues"
                columnAutoFill={autoFill}
            />
        );
    }

    return (
        <GroupedIssueList
            issues={issues}
            groupBy={groupBy}
            selectionScope="my-issues"
            total={total}
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
            autoFill={autoFill}
        />
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
