"use client";
import { useMemo, useState } from "react";
import { filterBoard } from "./data";
import type { KanbanView } from "./types";
import { useKanbanBoard } from "./useKanbanBoard";
import { useKanbanOptions } from "./useKanbanOptions";
import KanbanOptionsBar from "./KanbanOptionsBar";
import KanbanBoardView from "./KanbanBoardView";
import KanbanListView from "./KanbanListView";

/**
 * The Kanban board where teams file issues and agents pick them up. Owns the board
 * state, the toolbar options (search / labels / focus filter), and the Board/List
 * view toggle. The displayed board is the raw board with the search + label filters
 * applied; the focus filter is handled inside each view.
 */
export default function KanbanMainPane() {
    const kanban = useKanbanBoard();
    const options = useKanbanOptions();
    const [view, setView] = useState<KanbanView>("board");

    const filteredBoard = useMemo(
        () => filterBoard(kanban.board, options.search, options.selectedLabels),
        [kanban.board, options.search, options.selectedLabels],
    );

    function renderBoard() {
        if (view === "board") {
            return <KanbanBoardView {...kanban} board={filteredBoard} filter={options.filter} />;
        } else {
            return <KanbanListView board={filteredBoard} filter={options.filter} />;
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <KanbanOptionsBar options={options} view={view} onViewChange={setView} />
            {renderBoard()}
        </div>
    );
}
