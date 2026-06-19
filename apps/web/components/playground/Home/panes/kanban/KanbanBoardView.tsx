"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { COLUMNS, isBridgeStatus } from "./data";
import type { BoardState } from "./types";
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
 * single-column focus is rendered by `KanbanMainPane`, not here. The shared
 * DndContext lives in `KanbanMainPane`.
 */
export default function KanbanBoardView({ board, leading, startAligned }: KanbanBoardViewProps) {
    return (
        <div
            className={cn(
                "flex min-h-0 flex-1 gap-4 overflow-x-auto px-3 pt-3 pb-3",
                startAligned && "items-start",
            )}
        >
            {leading}
            {COLUMNS.map((column) => (
                <KanbanColumn
                    key={column.status}
                    column={column}
                    issues={board[column.status]}
                    droppable={isBridgeStatus(column.status)}
                    draggableCards={isBridgeStatus(column.status)}
                />
            ))}
        </div>
    );
}
