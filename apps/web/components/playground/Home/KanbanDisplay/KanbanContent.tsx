"use client";
import { useFilteredKanbanBoard } from "@/hooks/kanban/useFilteredKanbanBoard";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import type { BoardScope } from "@/types/board";

import CustomKanbanBoard from "./customkanban/CustomKanbanBoard";
import KanbanBoardView from "./KanbanBoardView";
import KanbanFocusColumn from "./KanbanFocusColumn";
import KanbanListView from "./KanbanListView";

export default function KanbanContent({ scope }: { scope: BoardScope }) {
    const focus = useKanbanOptionsStore((s) => s.focus);
    const kanbanView = useKanbanOptionsStore((s) => s.kanbanView);
    const board = useFilteredKanbanBoard();

    if (focus.kind !== "default") {
        return (
            <div className="flex min-h-0 flex-1 items-start overflow-hidden px-3 pt-3 pb-3">
                <KanbanFocusColumn focus={focus} board={board} />
            </div>
        );
    }

    if (scope.kind === "space") {
        return kanbanView === "list" ? (
            <KanbanListView />
        ) : (
            <div className="flex min-h-0 flex-1 items-start gap-4 overflow-x-auto px-3 pt-3 pb-3">
                <CustomKanbanBoard />
            </div>
        );
    }

    return kanbanView === "list" ? (
        <KanbanListView board={board} />
    ) : (
        <KanbanBoardView board={board} />
    );
}
