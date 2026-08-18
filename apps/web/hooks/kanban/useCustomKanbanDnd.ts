"use client";
import { useRef } from "react";
import {
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { toast } from "@/lib/toast";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { useReorderColumns } from "@/hooks/issues/useReorderColumns";
import { findIssueInBoard, useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import {
    columnIdOfInColumns,
    findCardInColumns,
    useCustomKanbanStore,
} from "@/store/kanban/useCustomKanbanStore";

export function useCustomKanbanDnd() {
    const projectId = useActiveProject()?.id;
    const updateIssue = useUpdateIssue();
    const reorderColumns = useReorderColumns();

    const dragOriginColumn = useRef<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    function onDragStart(event: DragStartEvent) {
        const id = String(event.active.id);
        const columns = useCustomKanbanStore.getState().columns;

        const found = findCardInColumns(columns, id);
        if (found) {
            useCustomKanbanStore.getState().setActiveItem({ kind: "custom", card: found.card });
            dragOriginColumn.current = found.columnId;
            return;
        }

        const column = columns.find((c) => c.id === id);
        if (column) {
            useCustomKanbanStore.getState().setActiveItem({ kind: "column", column });
            dragOriginColumn.current = null;
            return;
        }

        dragOriginColumn.current = null;
        const issue = findIssueInBoard(useKanbanBoardStore.getState().board, id);
        useCustomKanbanStore.getState().setActiveItem(issue ? { kind: "issue", issue } : null);
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;
        const activeId = String(active.id);
        const columns = useCustomKanbanStore.getState().columns;
        if (!findCardInColumns(columns, activeId)) return;

        const overId = String(over.id);
        const from = columnIdOfInColumns(columns, activeId);
        const to = columnIdOfInColumns(columns, overId);
        if (!from || !to || from === to) return;

        useCustomKanbanStore.getState().moveCardBetweenColumns(activeId, from, to, overId);
    }

    function onDragEnd(event: DragEndEvent) {
        useCustomKanbanStore.getState().setActiveItem(null);
        const { active, over } = event;
        if (!over) return;
        const activeId = String(active.id);
        const overId = String(over.id);

        const columns = useCustomKanbanStore.getState().columns;

        if (columns.some((c) => c.id === activeId)) {
            const overColumnId = columnIdOfInColumns(columns, overId);
            if (!overColumnId || overColumnId === activeId) return;
            useCustomKanbanStore.getState().reorderColumn(activeId, overColumnId);
            persistColumnOrder();
            return;
        }

        const fromCustom = findCardInColumns(columns, activeId);
        const toCustomColumn = columnIdOfInColumns(columns, overId);

        if (!fromCustom) {
            const issue = findIssueInBoard(useKanbanBoardStore.getState().board, activeId);
            if (!toCustomColumn || !issue) return;
            useKanbanBoardStore.getState().removeIssue(activeId);
            useCustomKanbanStore.getState().insertCard(
                toCustomColumn,
                {
                    id: activeId,
                    title: issue.title,
                    tags: issue.tags,
                    priority: issue.priority,
                    assignees: issue.assignees,
                },
                overId,
            );
            persistMove(activeId, toCustomColumn);
            return;
        }

        if (!toCustomColumn) {
            if (!KanbanBoard.isBridgeStatus(overId)) return;
            useCustomKanbanStore.getState().removeCardLocal(activeId);
            useKanbanBoardStore.getState().addIssue(overId, fromCustom.card);
            persistMove(activeId, null);
            return;
        }

        if (fromCustom.columnId !== toCustomColumn) return;
        useCustomKanbanStore.getState().reorderCard(toCustomColumn, activeId, overId);

        if (dragOriginColumn.current && dragOriginColumn.current !== fromCustom.columnId) {
            persistMove(activeId, fromCustom.columnId);
        }
    }

    function persistMove(cardId: string, columnId: string | null) {
        if (!projectId) return;
        updateIssue
            .mutateAsync({ id: cardId, project_id: projectId, custom_column_id: columnId })
            .catch(() => toast.error("Couldn't move the issue."));
    }

    function persistColumnOrder() {
        if (!projectId) return;
        const columnIds = useCustomKanbanStore.getState().columns.map((c) => c.id);
        reorderColumns
            .mutateAsync({ project_id: projectId, column_ids: columnIds })
            .catch(() => toast.error("Couldn't save the new column order."));
    }

    return { sensors, onDragStart, onDragOver, onDragEnd };
}
