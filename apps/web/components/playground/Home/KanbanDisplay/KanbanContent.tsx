"use client";
import type { BoardState, BoardView, KanbanView } from "@/types/kanban";
import type { FilterValue } from "@/hooks/kanban/useKanbanOptions";
import type { CustomKanbanApi } from "@/hooks/kanban/useCustomKanban";
import KanbanBoardView from "./KanbanBoardView";
import KanbanListView from "./KanbanListView";
import KanbanFocusColumn from "./KanbanFocusColumn";
import KanbanBothBoards from "./KanbanBothBoards";
import CustomKanbanBoard from "./customkanban/CustomKanbanBoard";

type KanbanContentProps = {
    filter: FilterValue;
    board: BoardState;
    custom: CustomKanbanApi;
    boardView: BoardView;
    kanbanView: KanbanView;
};

/**
 * Decides what to render inside the board area. A focus filter always wins;
 * otherwise the board switcher picks between the Custom board, the LLM board
 * (grid or list), or both together.
 */
export default function KanbanContent({
    filter,
    board,
    custom,
    boardView,
    kanbanView,
}: KanbanContentProps) {
    // A focused column takes precedence over the board switcher.
    if (filter.kind !== "default") {
        return (
            <div className="flex min-h-0 flex-1 items-start overflow-hidden px-3 pt-3 pb-3">
                <KanbanFocusColumn filter={filter} board={board} custom={custom} />
            </div>
        );
    }

    switch (boardView) {
        case "custom":
            return (
                <div className="flex min-h-0 flex-1 items-start gap-4 overflow-x-auto px-3 pt-3 pb-3">
                    <CustomKanbanBoard {...custom} />
                </div>
            );
        case "llm":
            return kanbanView === "list" ? (
                <KanbanListView board={board} />
            ) : (
                <KanbanBoardView board={board} />
            );
        case "default":
            return <KanbanBothBoards board={board} custom={custom} kanbanView={kanbanView} />;
    }
}
