"use client";
import { useState } from "react";
import {
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { INITIAL_BOARD } from "./data";
import { KanbanStatus, type BoardState, type Issue } from "./types";

const STATUSES = Object.values(KanbanStatus);

/** Everything `useKanbanBoard` exposes — the props `KanbanBoardView` consumes. */
export type KanbanBoardApi = ReturnType<typeof useKanbanBoard>;

/**
 * Local board state + cross-column drag-and-drop wiring (dnd-kit). Reordering is
 * client-only for now — there's no issue API yet — so a refresh resets the board
 * to `INITIAL_BOARD`.
 *
 * Cross-column moves happen live in `onDragOver` (so the card follows the cursor
 * into the new column); same-column reordering settles in `onDragEnd`.
 */
export function useKanbanBoard() {
    const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
    // The card currently being dragged — rendered in the DragOverlay.
    const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

    // A small drag threshold so clicking a card doesn't start a drag.
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    /** Which column currently holds `id` — or, if `id` is a column, itself. */
    function columnOf(id: string): KanbanStatus | null {
        if (STATUSES.includes(id as KanbanStatus)) return id as KanbanStatus;
        return STATUSES.find((status) => board[status].some((i) => i.id === id)) ?? null;
    }

    function onDragStart(event: DragStartEvent) {
        const status = columnOf(String(event.active.id));
        setActiveIssue(
            status ? (board[status].find((i) => i.id === event.active.id) ?? null) : null,
        );
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;
        const from = columnOf(String(active.id));
        const to = columnOf(String(over.id));
        if (!from || !to || from === to) return;

        setBoard((prev) => {
            const moved = prev[from].find((i) => i.id === active.id);
            if (!moved) return prev;
            const overIndex = prev[to].findIndex((i) => i.id === over.id);
            const insertAt = overIndex >= 0 ? overIndex : prev[to].length;
            return {
                ...prev,
                [from]: prev[from].filter((i) => i.id !== active.id),
                [to]: [
                    ...prev[to].slice(0, insertAt),
                    { ...moved, status: to },
                    ...prev[to].slice(insertAt),
                ],
            };
        });
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveIssue(null);
        const { active, over } = event;
        if (!over) return;
        const column = columnOf(String(active.id));
        const overColumn = columnOf(String(over.id));
        if (!column || column !== overColumn) return; // cross-column handled in onDragOver

        const oldIndex = board[column].findIndex((i) => i.id === active.id);
        const newIndex = board[column].findIndex((i) => i.id === over.id);
        if (newIndex >= 0 && oldIndex !== newIndex) {
            setBoard((prev) => ({
                ...prev,
                [column]: arrayMove(prev[column], oldIndex, newIndex),
            }));
        }
    }

    return { board, activeIssue, sensors, onDragStart, onDragOver, onDragEnd };
}
