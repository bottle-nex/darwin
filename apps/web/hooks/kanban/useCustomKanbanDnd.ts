"use client";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import type { BoardState } from "@/types/kanban";
import type { CustomColumn } from "@/types/kanban-custom";
import { moveBoardIssueCaches, reconcileBoardProject } from "@/hooks/issues/boardCache";

export function useCustomKanbanDnd(board: BoardState, sourceColumns: CustomColumn[]) {
    const projectId = useActiveProject()?.id;
    const updateIssue = useUpdateIssue();
    const reorderColumns = useReorderColumns();
    const queryClient = useQueryClient();

    const dragOriginColumn = useRef<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    function onDragStart(event: DragStartEvent) {
        useKanbanBoardStore.getState().beginOverlay(board);
        useCustomKanbanStore.getState().beginOverlay(sourceColumns);
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

    function completeDrag(event: DragEndEvent) {
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
                    boardIssue: issue.boardIssue
                        ? { ...issue.boardIssue, customColumnId: toCustomColumn }
                        : undefined,
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

    function clearDrag() {
        useKanbanBoardStore.getState().clearOverlay();
        useCustomKanbanStore.getState().clearOverlay();
        dragOriginColumn.current = null;
    }

    function onDragEnd(event: DragEndEvent) {
        try {
            completeDrag(event);
        } finally {
            clearDrag();
        }
    }

    function onDragCancel() {
        clearDrag();
    }

    function persistMove(cardId: string, columnId: string | null) {
        if (!projectId) return;
        moveBoardIssueCaches(queryClient, projectId, cardId, columnId);
        updateIssue
            .mutateAsync({ id: cardId, project_id: projectId, custom_column_id: columnId })
            .catch(() => {
                reconcileBoardProject(queryClient, projectId);
                toast.error("Couldn't move the issue.");
            });
    }

    function persistColumnOrder() {
        if (!projectId) return;
        const columnIds = useCustomKanbanStore.getState().columns.map((c) => c.id);
        reorderColumns
            .mutateAsync({ project_id: projectId, column_ids: columnIds })
            .catch(() => toast.error("Couldn't save the new column order."));
    }

    return { sensors, onDragStart, onDragOver, onDragEnd, onDragCancel };
}
