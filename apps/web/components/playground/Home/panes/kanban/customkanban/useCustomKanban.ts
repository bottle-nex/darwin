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
import { isBridgeStatus } from "../data";
import type { KanbanStatus, Issue } from "../types";
import { INITIAL_CUSTOM_COLUMNS } from "./data";
import type { CustomCard, CustomColumn, NewCardInput } from "./types";

type UseCustomKanbanArgs = {
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
 * In-memory state for the user-built Custom Kanban plus its drag-and-drop. Cards
 * reorder and move freely between custom columns; dropping one over an LLM
 * bridge column files it there, and a bridge-column issue dragged onto a custom
 * column lands as a new card. Which LLM columns bridge is decided by
 * `BRIDGE_STATUSES` (see `data.ts`) — this hook stays status-agnostic, keying off
 * whether the drop target is a custom column or not. Kept local like the LLM
 * board's state — no work-item backend yet, so a refresh resets it.
 */
export function useCustomKanban({ onSendToBoard, getIssue, removeIssue }: UseCustomKanbanArgs) {
    const [columns, setColumns] = useState<CustomColumn[]>(INITIAL_CUSTOM_COLUMNS);
    const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);

    // A small drag threshold so clicking a card doesn't start a drag.
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const addColumn = (title: string) => {
        const name = title.trim();
        if (!name) return;
        setColumns((prev) => [...prev, { id: crypto.randomUUID(), title: name, cards: [] }]);
    };

    const removeColumn = (columnId: string) => {
        setColumns((prev) => prev.filter((col) => col.id !== columnId));
    };

    const addCard = (columnId: string, input: NewCardInput) => {
        const title = input.title.trim();
        if (!title) return;
        const card: CustomCard = {
            id: crypto.randomUUID(),
            title,
            description: input.description.trim() || undefined,
            label: input.label,
            priority: input.priority,
        };
        setColumns((prev) =>
            prev.map((col) =>
                col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
            ),
        );
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
            return;
        }
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

        // A bridge-column issue dragged onto a custom column lands as a new card.
        if (!fromCustom) {
            const issue = getIssue(activeId);
            if (!toCustomColumn || !issue) return;
            removeIssue(activeId);
            insertCard(
                toCustomColumn,
                {
                    id: crypto.randomUUID(),
                    title: issue.title,
                    label: issue.label?.name,
                    priority: issue.priority,
                },
                overId,
            );
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
    }

    return {
        columns,
        addColumn,
        removeColumn,
        addCard,
        activeItem,
        sensors,
        onDragStart,
        onDragOver,
        onDragEnd,
    };
}
