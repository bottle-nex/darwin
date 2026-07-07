"use client";
import { COLUMNS, isBridgeStatus } from "./data";
import type { BoardState } from "./types";
import type { FilterValue } from "./useKanbanOptions";
import type { CustomKanbanApi } from "./customkanban/useCustomKanban";
import KanbanColumn from "./KanbanColumn";
import CustomKanbanColumn from "./customkanban/CustomKanbanColumn";

type KanbanFocusColumnProps = {
    /** The active focus — an LLM status or a custom column. */
    filter: FilterValue;
    board: BoardState;
    custom: CustomKanbanApi;
};

/**
 * The single column shown when the toolbar's focus filter is active. An LLM
 * status expands full-width as a grid; a custom column keeps its normal
 * Trello-width list with all its card actions.
 */
export default function KanbanFocusColumn({ filter, board, custom }: KanbanFocusColumnProps) {
    if (filter.kind === "llm") {
        const column = COLUMNS.find((c) => c.status === filter.status);
        if (!column) return null;
        return (
            <KanbanColumn
                column={column}
                issues={board[column.status]}
                layout="grid"
                fullWidth
                droppable={isBridgeStatus(column.status)}
                draggableCards={isBridgeStatus(column.status)}
            />
        );
    }

    if (filter.kind === "custom") {
        const column = custom.columns.find((c) => c.id === filter.columnId);
        if (!column) return null;
        return (
            <CustomKanbanColumn
                column={column}
                onAddCard={(input) => custom.addCard(column.id, input)}
                onDelete={() => custom.removeColumn(column.id)}
                onRename={(label) => custom.renameColumn(column.id, label)}
                onRecolor={(color) => custom.recolorColumn(column.id, color)}
                onEditCard={custom.editCard}
                onDeleteCard={custom.removeCard}
                projectId={custom.projectId}
                onAssign={custom.assignMember}
                onUnassign={custom.unassignMember}
            />
        );
    }

    return null;
}
