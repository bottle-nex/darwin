"use client";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { BoardState } from "@/types/kanban";
import type { FocusValue } from "@/store/kanban/useKanbanOptionsStore";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { IssueSelectionOrderProvider } from "@/hooks/issues/useIssueSelection";
import KanbanColumn from "./KanbanColumn";
import CustomKanbanColumn from "./customkanban/CustomKanbanColumn";

type KanbanFocusColumnProps = {
    focus: FocusValue;
    board: BoardState;
};

export default function KanbanFocusColumn({ focus, board }: KanbanFocusColumnProps) {
    const columns = useFilteredCustomColumns();

    if (focus.kind === "llm") {
        const column = KanbanBoard.COLUMNS.find((c) => c.status === focus.status);
        if (!column) return null;
        const issues = board[column.status];
        return (
            <IssueSelectionOrderProvider issueIds={issues.map((issue) => issue.id)}>
                <KanbanColumn
                    column={column}
                    issues={issues}
                    layout="grid"
                    fullWidth
                    droppable={KanbanBoard.isBridgeStatus(column.status)}
                    draggableCards={KanbanBoard.isBridgeStatus(column.status)}
                />
            </IssueSelectionOrderProvider>
        );
    }

    if (focus.kind === "custom") {
        const column = columns.find((c) => c.id === focus.columnId);
        if (!column) return null;
        return (
            <IssueSelectionOrderProvider issueIds={column.cards.map((card) => card.id)}>
                <CustomKanbanColumn column={column} draggable={false} />
            </IssueSelectionOrderProvider>
        );
    }

    return null;
}
