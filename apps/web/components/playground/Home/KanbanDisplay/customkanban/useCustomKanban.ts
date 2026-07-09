"use client";
import { useRef, useState } from "react";
import {
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { isBridgeStatus } from "../data";
import type { KanbanStatus, Issue } from "../types";
import { useCreateColumn } from "@/hooks/issues/useCreateColumn";
import { useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { useDeleteIssue } from "@/hooks/issues/useDeleteIssue";
import { useUpdateColumn } from "@/hooks/issues/useUpdateColumn";
import { useDeleteColumn } from "@/hooks/issues/useDeleteColumn";
import { useAssignIssue, useUnassignIssue } from "@/hooks/issues/useAssignIssue";
import type { BoardResponse } from "@/types/board";
import { INITIAL_CUSTOM_COLUMNS } from "./data";
import { boardToColumns } from "./mappers";
import type { CustomCard, CustomColumn } from "./types";

type UseCustomKanbanArgs = {
    /** The project these columns/issues belong to. Creation is disabled until it resolves. */
    projectId: string | undefined;
    /** The hydrated board from the server; seeds the columns once it loads. */
    board: BoardResponse | undefined;
    /** File a custom card into an LLM bridge column when dropped over it. */
    onSendToBoard: (status: KanbanStatus, card: CustomCard) => void;
    /** Read a bridge-column issue being dragged in (to render / convert it). */
    getIssue: (id: string) => Issue | null;
    /** Pull a bridge-column issue out of the LLM board once dropped on a custom column. */
    removeIssue: (id: string) => void;
};

/** The active drag — a custom card being moved, or an LLM issue dragged in. */
type ActiveItem = { kind: "custom"; card: CustomCard } | { kind: "issue"; issue: Issue };

/** Everything `useCustomKanban` exposes — board state plus drag-and-drop. */
export type CustomKanbanApi = ReturnType<typeof useCustomKanban>;

/**
 * Column/card state for the user-built Custom Kanban plus its drag-and-drop. Cards
 * reorder and move freely between custom columns; dropping one over an LLM
 * bridge column files it there, and a bridge-column issue dragged onto a custom
 * column lands as a new card. Which LLM columns bridge is decided by
 * `BRIDGE_STATUSES` (see `data.ts`) — this hook stays status-agnostic, keying off
 * whether the drop target is a custom column or not. Cards are real server issues
 * parked in a column; local state mirrors the board query and reseeds on refetch.
 */
export function useCustomKanban({
    projectId,
    board,
    onSendToBoard,
    getIssue,
    removeIssue,
}: UseCustomKanbanArgs) {
    const [columns, setColumns] = useState<CustomColumn[]>(INITIAL_CUSTOM_COLUMNS);
    const [seededBoard, setSeededBoard] = useState<BoardResponse | undefined>(undefined);
    const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);

    const createColumn = useCreateColumn();
    const updateIssue = useUpdateIssue();
    const deleteIssue = useDeleteIssue();
    const updateColumn = useUpdateColumn();
    const deleteColumn = useDeleteColumn();
    const assignIssue = useAssignIssue();
    const unassignIssue = useUnassignIssue();

    const dragOriginColumn = useRef<string | null>(null);

    if (board && board !== seededBoard) {
        setSeededBoard(board);
        setColumns(boardToColumns(board));
    }

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const addColumn = async (title: string) => {
        const name = title.trim();
        if (!name || !projectId) return;
        try {
            const column = await createColumn.mutateAsync({ project_id: projectId, label: name });
            setColumns((prev) => [...prev, { id: column.id, title: column.label, cards: [] }]);
        } catch {
            toast.error("Couldn't create the list.");
        }
    };

    const removeColumn = async (columnId: string) => {
        if (!projectId) return;
        setColumns((prev) => prev.filter((col) => col.id !== columnId));
        try {
            await deleteColumn.mutateAsync({ id: columnId, project_id: projectId });
        } catch {
            toast.error("Couldn't delete the list.");
        }
    };

    const renameColumn = async (columnId: string, label: string) => {
        const name = label.trim();
        if (!name || !projectId) return;
        setColumns((prev) =>
            prev.map((col) => (col.id === columnId ? { ...col, title: name } : col)),
        );
        try {
            await updateColumn.mutateAsync({ id: columnId, project_id: projectId, label: name });
        } catch {
            toast.error("Couldn't rename the list.");
        }
    };

    const removeCard = async (cardId: string) => {
        if (!projectId) return;
        setColumns((prev) =>
            prev.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) })),
        );
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

    /** Locate a card (and the column holding it) by id. */
    function findCard(cardId: string): { columnId: string; card: CustomCard } | null {
        for (const col of columns) {
            const card = col.cards.find((c) => c.id === cardId);
            if (card) return { columnId: col.id, card };
        }
        return null;
    }

    /** The column for an id — itself if it's a column, else the card's column. */
    function columnIdOf(id: string): string | null {
        if (columns.some((c) => c.id === id)) return id;
        return columns.find((c) => c.cards.some((card) => card.id === id))?.id ?? null;
    }

    /** Insert a card into a column, at `overId`'s position if it's a card there. */
    function insertCard(columnId: string, card: CustomCard, overId: string) {
        setColumns((prev) =>
            prev.map((col) => {
                if (col.id !== columnId) return col;
                const overIndex = col.cards.findIndex((c) => c.id === overId);
                const at = overIndex >= 0 ? overIndex : col.cards.length;
                return { ...col, cards: [...col.cards.slice(0, at), card, ...col.cards.slice(at)] };
            }),
        );
    }

    function onDragStart(event: DragStartEvent) {
        const id = String(event.active.id);
        const found = findCard(id);
        if (found) {
            setActiveItem({ kind: "custom", card: found.card });
            dragOriginColumn.current = found.columnId;
            return;
        }
        dragOriginColumn.current = null;
        const issue = getIssue(id);
        setActiveItem(issue ? { kind: "issue", issue } : null);
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;
        const activeId = String(active.id);
        // Only custom-to-custom moves happen live; the rest settle on drop.
        if (!findCard(activeId)) return;

        const overId = String(over.id);
        const from = columnIdOf(activeId);
        const to = columnIdOf(overId);
        if (!from || !to || from === to) return;

        setColumns((prev) => {
            const moved = prev.find((c) => c.id === from)?.cards.find((c) => c.id === activeId);
            const toCol = prev.find((c) => c.id === to);
            if (!moved || !toCol) return prev;
            const overIndex = toCol.cards.findIndex((c) => c.id === overId);
            const insertAt = overIndex >= 0 ? overIndex : toCol.cards.length;
            return prev.map((col) => {
                if (col.id === from) {
                    return { ...col, cards: col.cards.filter((c) => c.id !== activeId) };
                }
                if (col.id === to) {
                    return {
                        ...col,
                        cards: [
                            ...col.cards.slice(0, insertAt),
                            moved,
                            ...col.cards.slice(insertAt),
                        ],
                    };
                }
                return col;
            });
        });
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveItem(null);
        const { active, over } = event;
        if (!over) return;
        const activeId = String(active.id);
        const overId = String(over.id);

        const fromCustom = findCard(activeId);
        const toCustomColumn = columnIdOf(overId);

        // A bridge-lane issue (a real server issue) dragged onto a custom column.
        // Keep its real id and persist the move into that column.
        if (!fromCustom) {
            const issue = getIssue(activeId);
            if (!toCustomColumn || !issue) return;
            removeIssue(activeId);
            insertCard(
                toCustomColumn,
                {
                    id: activeId,
                    title: issue.title,
                    tags: issue.tags,
                    priority: issue.priority,
                    assignees: issue.assignees.map((a) => ({
                        id: a.id,
                        name: a.name,
                        image: null,
                    })),
                },
                overId,
            );
            persistMove(activeId, toCustomColumn);
            return;
        }

        // A custom card dropped onto a bridge column is filed there as an issue.
        if (!toCustomColumn) {
            if (!isBridgeStatus(overId)) return;
            setColumns((prev) =>
                prev.map((col) =>
                    col.id === fromCustom.columnId
                        ? { ...col, cards: col.cards.filter((c) => c.id !== activeId) }
                        : col,
                ),
            );
            onSendToBoard(overId, fromCustom.card);
            // Persist: the issue leaves its custom column (moves into a status lane).
            persistMove(activeId, null);
            return;
        }

        // Same-column reorder settles here (cross-column handled in onDragOver).
        if (fromCustom.columnId !== toCustomColumn) return;
        setColumns((prev) =>
            prev.map((col) => {
                if (col.id !== toCustomColumn) return col;
                const oldIndex = col.cards.findIndex((c) => c.id === activeId);
                const newIndex = col.cards.findIndex((c) => c.id === overId);
                if (newIndex < 0 || oldIndex === newIndex) return col;
                return { ...col, cards: arrayMove(col.cards, oldIndex, newIndex) };
            }),
        );

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
        projectId,
        columns,
        addColumn,
        removeColumn,
        renameColumn,
        removeCard,
        assignMember,
        unassignMember,
        activeItem,
        sensors,
        onDragStart,
        onDragOver,
        onDragEnd,
    };
}
