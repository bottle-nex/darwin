"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { BoardState } from "@/types/kanban";
import KanbanColumn from "./KanbanColumn";

type KanbanBoardViewProps = {
    board: BoardState;
    /** Columns to render before the LLM columns (e.g. the Custom Kanban) so both
     *  boards flow through one continuous scroll row. */
    leading?: ReactNode;
    /** Size columns to their content (Trello-style) instead of stretching them. */
    startAligned?: boolean;
};

/**
 * Board view: the LLM columns as a horizontal row. `leading` lets a caller
 * prepend the Custom Kanban so the two boards share one scroll. Only bridge
 * columns accept drops / let their cards be dragged out (see `BRIDGE_STATUSES`);
 * single-column focus is rendered by `KanbanDisplay`, not here. The shared
 * DndContext lives in `KanbanDisplay`.
 */
export default function KanbanBoardView({ board, leading, startAligned }: KanbanBoardViewProps) {
    return (
        <div
            data-kanban-scroll-row
            className={cn(
                "flex min-h-0 flex-1 gap-y-4 gap-x-2 overflow-x-auto px-3 pt-3 pb-3",
                startAligned && "items-start",
            )}
        >
            {leading}
            {KanbanBoard.COLUMNS.map((column) => (
                <KanbanColumn
                    key={column.status}
                    column={column}
                    issues={board[column.status]}
                    droppable={KanbanBoard.isBridgeStatus(column.status)}
                    draggableCards={KanbanBoard.isBridgeStatus(column.status)}
                />
            ))}
        </div>
    );
}
