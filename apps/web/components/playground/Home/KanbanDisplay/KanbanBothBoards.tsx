"use client";
import type { BoardState, KanbanView } from "@/types/kanban";
import KanbanBoardView from "./KanbanBoardView";
import KanbanListView from "./KanbanListView";
import CustomKanbanBoard from "./customkanban/CustomKanbanBoard";

type KanbanBothBoardsProps = {
    board: BoardState;
    kanbanView: KanbanView;
};

function Divider() {
    return <div className="my-3 w-px shrink-0 self-stretch bg-white/8" />;
}

export default function KanbanBothBoards({ board, kanbanView }: KanbanBothBoardsProps) {
    if (kanbanView === "list") {
        return (
            <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 items-start gap-4 overflow-x-auto px-3 pt-3 pb-3">
                    <CustomKanbanBoard />
                </div>
                <Divider />
                <div className="min-w-0 flex-1">
                    <KanbanListView board={board} />
                </div>
            </div>
        );
    }

    return (
        <KanbanBoardView
            board={board}
            startAligned
            leading={
                <>
                    <CustomKanbanBoard />
                    <Divider />
                </>
            }
        />
    );
}
