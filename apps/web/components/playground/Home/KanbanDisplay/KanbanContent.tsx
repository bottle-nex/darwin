"use client";
import { useFilteredKanbanBoard } from "@/hooks/kanban/useFilteredKanbanBoard";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import KanbanBoardView from "./KanbanBoardView";
import KanbanListView from "./KanbanListView";
import KanbanFocusColumn from "./KanbanFocusColumn";
import KanbanBothBoards from "./KanbanBothBoards";
import CustomKanbanBoard from "./customkanban/CustomKanbanBoard";

export default function KanbanContent() {
    const focus = useKanbanOptionsStore((s) => s.focus);
    const boardView = useKanbanOptionsStore((s) => s.boardView);
    const kanbanView = useKanbanOptionsStore((s) => s.kanbanView);
    const board = useFilteredKanbanBoard();

    if (focus.kind !== "default") {
        return (
            <div className="flex min-h-0 flex-1 items-start overflow-hidden px-3 pt-3 pb-3">
                <KanbanFocusColumn focus={focus} board={board} />
            </div>
        );
    }

    switch (boardView) {
        case "custom":
            return (
                <div className="flex min-h-0 flex-1 items-start gap-4 overflow-x-auto px-3 pt-3 pb-3">
                    <CustomKanbanBoard />
                </div>
            );
        case "llm":
            return kanbanView === "list" ? (
                <KanbanListView board={board} />
            ) : (
                <KanbanBoardView board={board} />
            );
        case "default":
            return <KanbanBothBoards board={board} kanbanView={kanbanView} />;
    }
}
