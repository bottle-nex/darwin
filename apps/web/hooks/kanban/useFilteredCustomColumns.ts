"use client";
import { useMemo } from "react";
import { CustomKanbanMappers } from "@/lib/kanban/CustomKanbanMappers";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import { useIssueFilter } from "@/hooks/kanban/useIssueFilter";
import type { CustomColumn } from "@/types/kanban-custom";

/**
 * The Custom Kanban's columns. Same self-healing shape as
 * `useFilteredKanbanBoard`: `useCustomKanbanStore.columns` is a mirror seeded
 * by `useKanbanPane` in an effect, but it also holds local-only edits (column
 * add/rename/reorder, card drag-and-drop) that never round-trip through the
 * server, so it can't just be replaced by a query-derived value. Re-derive
 * straight from the query whenever its data has moved past what's been
 * seeded, so a render can't show a stale/empty board while the mirror catches up.
 */
export function useFilteredCustomColumns(): CustomColumn[] {
    const activeProject = useActiveProject();
    const { data: serverBoard } = useBoard(activeProject?.id);

    const seededBoard = useCustomKanbanStore((s) => s.seededBoard);
    const mirroredColumns = useCustomKanbanStore((s) => s.columns);
    const matchesFilters = useIssueFilter({ skipStatus: true });

    const columns = useMemo(() => {
        if (!serverBoard || seededBoard === serverBoard) return mirroredColumns;
        return CustomKanbanMappers.boardToColumns(serverBoard);
    }, [serverBoard, seededBoard, mirroredColumns]);

    return useMemo(
        () =>
            columns.map((column) => ({
                ...column,
                cards: column.cards.filter((card) => matchesFilters(card.id)),
            })),
        [columns, matchesFilters],
    );
}
