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
import { toast } from "sonner";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { useCreateColumn } from "@/hooks/issues/useCreateColumn";
import { useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { useDeleteIssue } from "@/hooks/issues/useDeleteIssue";
import { useUpdateColumn } from "@/hooks/issues/useUpdateColumn";
import { useDeleteColumn } from "@/hooks/issues/useDeleteColumn";
import { useAssignIssue, useUnassignIssue } from "@/hooks/issues/useAssignIssue";
import { findIssueInBoard, useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import {
    columnIdOfInColumns,
    findCardInColumns,
    useCustomKanbanStore,
} from "@/store/kanban/useCustomKanbanStore";

type UseCustomKanbanArgs = {
    /** The project these columns/issues belong to. Creation is disabled until it resolves. */
    projectId: string | undefined;
};

/** Everything `useCustomKanban` exposes — the actions the Custom Kanban needs. */
export type CustomKanbanApi = ReturnType<typeof useCustomKanban>;

/**
 * Drag-and-drop orchestration for the Custom Kanban, plus the mutations that
 * persist it. Column/card state lives in `useCustomKanbanStore` and the LLM
 * board lives in `useKanbanBoardStore` (seeded elsewhere, in `useKanbanPane`) —
 * this hook wires the two together: dropping a custom card over an LLM bridge
 * column files it there, and a bridge-column issue dragged onto a custom column
 * lands as a new card. Which LLM columns bridge is decided by `BRIDGE_STATUSES`
 * (see `data.ts`) — this hook stays status-agnostic, keying off whether the
 * drop target is a custom column or not.
 */
export function useCustomKanban({ projectId }: UseCustomKanbanArgs) {
    const createColumn = useCreateColumn();
    const updateIssue = useUpdateIssue();
    const deleteIssue = useDeleteIssue();
    const updateColumn = useUpdateColumn();
    const deleteColumn = useDeleteColumn();
    const assignIssue = useAssignIssue();
    const unassignIssue = useUnassignIssue();

    const dragOriginColumn = useRef<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const addColumn = async (title: string) => {
        const name = title.trim();
        if (!name || !projectId) return;
        try {
            const column = await createColumn.mutateAsync({ project_id: projectId, label: name });
            useCustomKanbanStore
                .getState()
                .addColumnLocal({ id: column.id, title: column.label, cards: [] });
        } catch {
            toast.error("Couldn't create the list.");
        }
    };

    const removeColumn = async (columnId: string) => {
        if (!projectId) return;
        useCustomKanbanStore.getState().removeColumnLocal(columnId);
        try {
            await deleteColumn.mutateAsync({ id: columnId, project_id: projectId });
        } catch {
            toast.error("Couldn't delete the list.");
        }
    };

    const renameColumn = async (columnId: string, label: string) => {
        const name = label.trim();
        if (!name || !projectId) return;
        useCustomKanbanStore.getState().renameColumnLocal(columnId, name);
        try {
            await updateColumn.mutateAsync({ id: columnId, project_id: projectId, label: name });
        } catch {
            toast.error("Couldn't rename the list.");
        }
    };

    const removeCard = async (cardId: string) => {
        if (!projectId) return;
        useCustomKanbanStore.getState().removeCardLocal(cardId);
        try {
            await deleteIssue.mutateAsync({ id: cardId, project_id: projectId });
        } catch {
            toast.error("Couldn't delete the issue.");
        }
    };

    // Assignment has no local optimistic step (we lack the member's name/image
    // here) — the board refetch on success refreshes the card's avatars.
    const assignMember = async (cardId: string, userId: string) => {
        if (!projectId) return;
        try {
            await assignIssue.mutateAsync({ id: cardId, project_id: projectId, user_id: userId });
        } catch {
            toast.error("Couldn't assign the member.");
        }
    };

    const unassignMember = async (cardId: string, userId: string) => {
        if (!projectId) return;
        try {
            await unassignIssue.mutateAsync({ id: cardId, project_id: projectId, user_id: userId });
        } catch {
            toast.error("Couldn't unassign the member.");
        }
    };

    function onDragStart(event: DragStartEvent) {
        const id = String(event.active.id);
        const found = findCardInColumns(useCustomKanbanStore.getState().columns, id);
        if (found) {
            useCustomKanbanStore.getState().setActiveItem({ kind: "custom", card: found.card });
            dragOriginColumn.current = found.columnId;
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
        // Only custom-to-custom moves happen live; the rest settle on drop.
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
        const fromCustom = findCardInColumns(columns, activeId);
        const toCustomColumn = columnIdOfInColumns(columns, overId);

        // A bridge-lane issue (a real server issue) dragged onto a custom column.
        // Keep its real id and persist the move into that column.
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

        // A custom card dropped onto a bridge column is filed there as an issue.
        if (!toCustomColumn) {
            if (!KanbanBoard.isBridgeStatus(overId)) return;
            useCustomKanbanStore.getState().removeCardLocal(activeId);
            useKanbanBoardStore.getState().addIssue(overId, fromCustom.card);
            // Persist: the issue leaves its custom column (moves into a status lane).
            persistMove(activeId, null);
            return;
        }

        // Same-column reorder settles here (cross-column handled in onDragOver).
        if (fromCustom.columnId !== toCustomColumn) return;
        useCustomKanbanStore.getState().reorderCard(toCustomColumn, activeId, overId);

        // If onDragOver moved the card into a different column, persist the new
        // column. (Within-column reorder isn't persisted — no position field.)
        if (dragOriginColumn.current && dragOriginColumn.current !== fromCustom.columnId) {
            persistMove(activeId, fromCustom.columnId);
        }
    }

    /** Persist a card's column move; `columnId === null` moves it out into a lane. */
    function persistMove(cardId: string, columnId: string | null) {
        if (!projectId) return;
        updateIssue
            .mutateAsync({ id: cardId, project_id: projectId, custom_column_id: columnId })
            .catch(() => toast.error("Couldn't move the issue."));
    }

    return {
        addColumn,
        removeColumn,
        renameColumn,
        removeCard,
        assignMember,
        unassignMember,
        sensors,
        onDragStart,
        onDragOver,
        onDragEnd,
    };
}
