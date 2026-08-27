"use client";
import { useMemo } from "react";

import { IssueSelectionOrderProvider } from "@/hooks/issues/useIssueSelection";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { BoardState } from "@/types/kanban";

import HiddenKanbanColumn from "./HiddenKanbanColumn";
import KanbanColumn from "./KanbanColumn";

type KanbanBoardViewProps = {
    board: BoardState;
};

/**
 * Board view: the LLM columns as a horizontal row. Only bridge columns accept
 * drops / let their cards be dragged out (see `BRIDGE_STATUSES`); single-column
 * focus is rendered by `KanbanDisplay`, not here. The shared DndContext lives in
 * `KanbanDisplay`.
 */
export default function KanbanBoardView({ board }: KanbanBoardViewProps) {
    const { visible: visibleColumns, hidden: hiddenColumns } = useMemo(
        () => KanbanBoard.partitionColumns(board),
        [board],
    );

    const loadedIssueIds = useMemo(
        () => KanbanBoard.STATUSES.flatMap((status) => board[status].map((issue) => issue.id)),
        [board],
    );

    return (
        <div
            data-kanban-scroll-row
            className="flex min-h-0 flex-1 items-start gap-y-4 gap-x-2 overflow-x-auto px-3 pt-3 pb-3"
        >
            <IssueSelectionOrderProvider issueIds={loadedIssueIds}>
                {visibleColumns.map((column) => (
                    <KanbanColumn
                        key={column.status}
                        column={column}
                        issues={board[column.status]}
                        droppable={KanbanBoard.isBridgeStatus(column.status)}
                        draggableCards={KanbanBoard.isBridgeStatus(column.status)}
                    />
                ))}
            </IssueSelectionOrderProvider>
            <HiddenKanbanColumn columns={hiddenColumns} />
        </div>
    );
}
