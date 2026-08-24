"use client";
import type { BoardState, KanbanView } from "@/types/kanban";

import CustomKanbanBoard from "./customkanban/CustomKanbanBoard";
import KanbanBoardView from "./KanbanBoardView";
import KanbanListView from "./KanbanListView";

type KanbanBothBoardsProps = {
    board: BoardState;
    kanbanView: KanbanView;
};

function Divider() {
    return <div className="my-3 w-px shrink-0 self-stretch bg-white/8" />;
}

export default function KanbanBothBoards({ board, kanbanView }: KanbanBothBoardsProps) {
    if (kanbanView === "list") {
        return <KanbanListView board={board} includeCustom />;
    }

    return (
        <KanbanBoardView
            board={board}
            leading={
                <>
                    <CustomKanbanBoard />
                    <Divider />
                </>
            }
        />
    );
}
