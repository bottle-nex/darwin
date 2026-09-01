"use client";

import { useMemo } from "react";

import type { FacetOption } from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/filterFacets";
import { useActiveProject } from "@/hooks/useActiveProject";
import {
    buildIssueGroups,
    type IssueGroup,
    type IssueGroupBy,
    NO_GROUPING,
} from "@/lib/kanban/issueGrouping";
import type { BoardIssue, BoardScope } from "@/types/board";

import { useBoardColumns } from "./useBoardColumns";
import { groupLabel, useGroupOptions } from "./useGroupOptions";

export type FacetIssueGroup = IssueGroup<FacetOption>;

/**
 * The issues split into their groups — the one shape both the list and the board
 * render. `keepEmpty` is what makes a board keep every column on screen.
 */
export function useIssueGroups(
    issues: BoardIssue[],
    groupBy: IssueGroupBy,
    { scope, keepEmpty = false }: { scope?: BoardScope; keepEmpty?: boolean } = {},
): FacetIssueGroup[] {
    const projectId = useActiveProject()?.id;
    const { data: metadata } = useBoardColumns(projectId);
    const options = useGroupOptions(groupBy, scope);

    return useMemo(() => {
        const spaceByColumn = new Map(
            (metadata?.columns ?? []).map((column) => [column.id, column.spaceId]),
        );
        return buildIssueGroups(issues, groupBy, {
            options,
            keepEmpty,
            ungroupedTitle:
                groupBy === NO_GROUPING ? "" : `No ${groupLabel(groupBy).toLowerCase()}`,
            spaceOfColumn: (columnId) => spaceByColumn.get(columnId),
        });
    }, [groupBy, issues, keepEmpty, metadata?.columns, options]);
}
