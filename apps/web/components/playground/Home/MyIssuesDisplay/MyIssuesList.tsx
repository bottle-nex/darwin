"use client";

import { useMemo } from "react";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import LogoLoader from "@/components/app/LogoLoader";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
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
    relevantIssueCount: number;
    projectName: string;
    view: MyIssuesView;
    groupBy: MyIssuesGroup;
    orderBy: MyIssuesOrder;
    loading: boolean;
    error: boolean;
    filtersActive: boolean;
    onClearFilters: () => void;
};

export default function MyIssuesList({
    issues,
    relevantIssueCount,
    projectName,
    view,
    groupBy,
    orderBy,
    loading,
    error,
    filtersActive,
    onClearFilters,
}: MyIssuesListProps) {
    const groups = useMemo(() => groupIssues(issues, groupBy, orderBy), [issues, groupBy, orderBy]);
    const filteredEmpty = relevantIssueCount > 0 && filtersActive;

    return (
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            {loading ? (
                <LogoLoader size={32} className="py-16" />
            ) : error ? (
                <div className="flex h-full flex-col justify-center">
                    <PaneEmptyState
                        icon={HiOutlineClipboardDocumentList}
                        title="Couldn’t load your issues"
                        subtitle="Try again in a moment."
                    />
                </div>
            ) : issues.length === 0 ? (
                <div className="flex h-full flex-col justify-center">
                    <PaneEmptyState
                        icon={HiOutlineClipboardDocumentList}
                        title={
                            filteredEmpty
                                ? "No issues match your filters"
                                : view === "assigned"
                                  ? "No issues assigned to you"
                                  : "You haven’t created any issues"
                        }
                        subtitle={
                            filteredEmpty
                                ? "Adjust or clear the board filters to see more issues."
                                : view === "assigned"
                                  ? "Issues assigned to you will appear here."
                                  : "Issues you file will appear here."
                        }
                    >
                        {filteredEmpty && (
                            <Button variant="tertiary" size="sm" onClick={onClearFilters}>
                                Clear filters
                            </Button>
                        )}
                    </PaneEmptyState>
                </div>
            ) : (
                <div className="flex w-full flex-col gap-3">
                    {groups.map((group) => (
                        <section key={group.key}>
                            {groupBy !== "none" && (
                                <div className="flex items-center gap-2 px-2 py-2 text-[12px] font-medium text-neutral-300">
                                    <group.icon
                                        className={cn("size-3.5", group.iconClassName)}
                                        aria-hidden
                                    />
                                    <span>{group.label}</span>
                                    <span className="text-neutral-600">{group.issues.length}</span>
                                </div>
                            )}
                            <div className="overflow-hidden rounded-lg ring-1 ring-white/7">
                                {group.issues.map((issue) => (
                                    <MyIssueRow
                                        key={issue.id}
                                        issue={issue}
                                        projectName={projectName}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
