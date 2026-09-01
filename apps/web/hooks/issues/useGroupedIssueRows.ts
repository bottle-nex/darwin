"use client";

import { useMemo, useState } from "react";

import type { FacetOption } from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/filterFacets";
import {
    flattenGroupedIssueRows,
    type GroupedIssueRow,
    loadedIssueSelectionIds,
} from "@/components/playground/Home/KanbanDisplay/virtualizedIssueRows";
import { type IssueGroup, type IssueGroupBy, NO_GROUPING } from "@/lib/kanban/issueGrouping";
import type { BoardIssue } from "@/types/board";

import { useIssueGroups } from "./useIssueGroups";

export type IssueRow = Extract<
    GroupedIssueRow<BoardIssue, IssueGroup<FacetOption>>,
    { kind: "group" } | { kind: "issue" }
>;

export function useGroupedIssueRows(issues: BoardIssue[], groupBy: IssueGroupBy) {
    const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<ReadonlySet<string>>(
        () => new Set(),
    );
    const groups = useIssueGroups(issues, groupBy);

    const rows = useMemo(() => {
        const flattened = flattenGroupedIssueRows(
            groups,
            (issue) => issue.id,
            false,
            collapsedGroupKeys,
        );
        return flattened.filter((row): row is IssueRow =>
            groupBy === NO_GROUPING ? row.kind === "issue" : row.kind !== "group-end",
        );
    }, [collapsedGroupKeys, groupBy, groups]);

    const stickyRowIndexes = useMemo(
        () => rows.flatMap((row, index) => (row.kind === "group" ? [index] : [])),
        [rows],
    );

    const issueRowIndexes = useMemo(() => {
        const indexes = new Map<string, number>();
        rows.forEach((row, index) => {
            if (row.kind === "issue" && !indexes.has(row.issue.id))
                indexes.set(row.issue.id, index);
        });
        return indexes;
    }, [rows]);

    const issuePositions = useMemo(() => {
        const positions: number[] = [];
        let issuesSoFar = 0;
        for (const row of rows) {
            if (row.kind !== "issue") {
                positions.push(0);
                continue;
            }
            issuesSoFar += 1;
            positions.push(issuesSoFar);
        }
        return positions;
    }, [rows]);

    const loadedIssueIds = useMemo(
        () =>
            loadedIssueSelectionIds(
                rows.flatMap((row) => (row.kind === "issue" ? [row.issue] : [])),
                (issue) => issue.id,
            ),
        [rows],
    );

    function toggleGroup(groupKey: string) {
        setCollapsedGroupKeys((current) => {
            const next = new Set(current);
            if (next.has(groupKey)) next.delete(groupKey);
            else next.add(groupKey);
            return next;
        });
    }

    return {
        groups,
        rows,
        stickyRowIndexes,
        issuePositions,
        loadedIssueIds,
        collapsedGroupKeys,
        toggleGroup,
        getRowKey: (row: IssueRow) =>
            row.kind === "issue" ? `${row.group.key}:${row.key}` : row.key,
        findIssueRow: (issueId: string) => issueRowIndexes.get(issueId) ?? -1,
    };
}
