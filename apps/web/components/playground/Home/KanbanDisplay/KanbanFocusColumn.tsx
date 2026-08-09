"use client";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { BoardState } from "@/types/kanban";
import type { FilterValue } from "@/store/kanban/useKanbanOptionsStore";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import KanbanColumn from "./KanbanColumn";
import CustomKanbanColumn from "./customkanban/CustomKanbanColumn";

type KanbanFocusColumnProps = {
    filter: FilterValue;
    board: BoardState;
};

export default function KanbanFocusColumn({ filter, board }: KanbanFocusColumnProps) {
    const columns = useFilteredCustomColumns();

    if (filter.kind === "llm") {
        const column = KanbanBoard.COLUMNS.find((c) => c.status === filter.status);
        if (!column) return null;
        return (
            <KanbanColumn
                column={column}
                issues={board[column.status]}
                layout="grid"
                fullWidth
                droppable={KanbanBoard.isBridgeStatus(column.status)}
                draggableCards={KanbanBoard.isBridgeStatus(column.status)}
            />
        );
    }

    if (filter.kind === "custom") {
        const column = columns.find((c) => c.id === filter.columnId);
        if (!column) return null;
        return <CustomKanbanColumn column={column} draggable={false} />;
    }

    return null;
}
