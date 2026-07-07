"use client";
import type { BoardState, KanbanView } from "./types";
import type { CustomKanbanApi } from "./customkanban/useCustomKanban";
import KanbanBoardView from "./KanbanBoardView";
import KanbanListView from "./KanbanListView";
import CustomKanbanBoard from "./customkanban/CustomKanbanBoard";

type KanbanBothBoardsProps = {
    board: BoardState;
    custom: CustomKanbanApi;
    kanbanView: KanbanView;
};

/** Thin vertical divider between the two boards. */
function Divider() {
    return <div className="w-px shrink-0 self-stretch bg-white/8" />;
}

/**
 * The default view: the Custom Kanban and the LLM board together. In board
 * layout they share one continuous left-to-right scroll row; in list layout they
 * split side by side (the LLM list isn't a column layout).
 */
export default function KanbanBothBoards({ board, custom, kanbanView }: KanbanBothBoardsProps) {
    if (kanbanView === "list") {
        return (
            <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 items-start gap-4 overflow-x-auto px-3 pt-3 pb-3">
                    <CustomKanbanBoard {...custom} />
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
                    <CustomKanbanBoard {...custom} />
                    <Divider />
                </>
            }
        />
    );
}
