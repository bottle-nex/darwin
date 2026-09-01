"use client";

import { type IconType, KanbanColumnsIcon } from "@trymatcha/ui/icons";
import { useMemo } from "react";

import {
    FACET_META,
    type FacetOption,
    useFacetOptions,
} from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/filterFacets";
import { useActiveProject } from "@/hooks/useActiveProject";
import {
    COLUMN_GROUPING,
    type IssueGroupBy,
    NO_COLUMN,
    NO_GROUPING,
} from "@/lib/kanban/issueGrouping";
import type { BoardScope } from "@/types/board";

import { useBoardColumns } from "./useBoardColumns";

const NO_OPTIONS: FacetOption[] = [];

export function groupLabel(groupBy: IssueGroupBy): string {
    if (groupBy === NO_GROUPING) return "No grouping";
    if (groupBy === COLUMN_GROUPING) return "Column";
    return FACET_META[groupBy].label;
}

/** The glyph a grouping draws when a group has none of its own. */
export function groupIcon(groupBy: IssueGroupBy): IconType | undefined {
    if (groupBy === NO_GROUPING) return undefined;
    if (groupBy === COLUMN_GROUPING) return KanbanColumnsIcon;
    return FACET_META[groupBy].icon;
}

/**
 * The values a grouping can take, in the order their columns and headers appear.
 * Filter facets already describe six of them; a space's own columns are the seventh.
 */
export function useGroupOptions(groupBy: IssueGroupBy, scope?: BoardScope): FacetOption[] {
    const projectId = useActiveProject()?.id;
    const { data: metadata } = useBoardColumns(projectId);
    const facetOptions = useFacetOptions(
        groupBy === NO_GROUPING || groupBy === COLUMN_GROUPING ? undefined : groupBy,
    );

    const columnOptions = useMemo(() => {
        if (groupBy !== COLUMN_GROUPING) return NO_OPTIONS;
        const columns = (metadata?.columns ?? []).filter(
            (column) => scope?.kind !== "space" || column.spaceId === scope.spaceId,
        );
        return [
            ...columns.map((column) => ({
                value: column.id,
                label: column.label,
                icon: KanbanColumnsIcon,
            })),
            { value: NO_COLUMN, label: "No column", icon: KanbanColumnsIcon },
        ];
    }, [groupBy, metadata?.columns, scope]);

    return groupBy === COLUMN_GROUPING ? columnOptions : facetOptions;
}
