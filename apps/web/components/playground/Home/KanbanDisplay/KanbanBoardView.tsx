"use client";
import { useMemo, type ReactNode } from "react";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { IssueSelectionOrderProvider } from "@/hooks/issues/useIssueSelection";
import type { BoardState, KanbanColumnDef } from "@/types/kanban";
import HiddenKanbanColumn from "./HiddenKanbanColumn";
import KanbanColumn from "./KanbanColumn";

type KanbanBoardViewProps = {
    board: BoardState;
    /** Columns to render before the LLM columns (e.g. the Custom Kanban) so both
     *  boards flow through one continuous scroll row. */
    leading?: ReactNode;
};

/**
 * Board view: the LLM columns as a horizontal row. `leading` lets a caller
 * prepend the Custom Kanban so the two boards share one scroll. Only bridge
 * columns accept drops / let their cards be dragged out (see `BRIDGE_STATUSES`);
 * single-column focus is rendered by `KanbanDisplay`, not here. The shared
 * DndContext lives in `KanbanDisplay`.
 */
export default function KanbanBoardView({ board, leading }: KanbanBoardViewProps) {
    const { visibleColumns, hiddenColumns } = useMemo(() => {
        const visibleColumns: KanbanColumnDef[] = [];
        const hiddenColumns: KanbanColumnDef[] = [];
        for (const column of KanbanBoard.COLUMNS) {
            (board[column.status].length === 0 ? hiddenColumns : visibleColumns).push(column);
        }
        return { visibleColumns, hiddenColumns };
    }, [board]);

    const loadedIssueIds = useMemo(
        () => KanbanBoard.STATUSES.flatMap((status) => board[status].map((issue) => issue.id)),
        [board],
    );

    return (
        <div
            data-kanban-scroll-row
            className="flex min-h-0 flex-1 items-start gap-y-4 gap-x-2 overflow-x-auto px-3 pt-3 pb-3"
        >
            {leading}
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
