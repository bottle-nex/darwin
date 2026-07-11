"use client";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { BoardState } from "@/types/kanban";
import type { FilterValue } from "@/hooks/kanban/useKanbanOptions";
import type { CustomKanbanApi } from "@/hooks/kanban/useCustomKanban";
import KanbanColumn from "./KanbanColumn";
import CustomKanbanColumn from "./customkanban/CustomKanbanColumn";

type KanbanFocusColumnProps = {
    filter: FilterValue;
    board: BoardState;
    custom: CustomKanbanApi;
};

export default function KanbanFocusColumn({ filter, board, custom }: KanbanFocusColumnProps) {
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
        const column = custom.columns.find((c) => c.id === filter.columnId);
        if (!column) return null;
        return (
            <CustomKanbanColumn
                column={column}
                onDelete={() => custom.removeColumn(column.id)}
                onRename={(label) => custom.renameColumn(column.id, label)}
                onDeleteCard={custom.removeCard}
                projectId={custom.projectId}
                onAssign={custom.assignMember}
                onUnassign={custom.unassignMember}
            />
        );
    }

    return null;
}
