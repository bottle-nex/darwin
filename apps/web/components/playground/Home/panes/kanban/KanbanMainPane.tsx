"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useBoard } from "@/hooks/issues/useBoard";
import { COLUMNS, filterBoard, isBridgeStatus } from "./data";
import type { BoardView, KanbanView } from "./types";
import { useKanbanBoard } from "./useKanbanBoard";
import { useKanbanOptions } from "./useKanbanOptions";
import { useCustomKanban } from "./customkanban/useCustomKanban";
import KanbanOptionsBar from "./KanbanOptionsBar";
import KanbanBoardView from "./KanbanBoardView";
import KanbanListView from "./KanbanListView";
import KanbanColumn from "./KanbanColumn";
import CustomKanbanBoard from "./customkanban/CustomKanbanBoard";
import CustomKanbanColumn from "./customkanban/CustomKanbanColumn";
import CustomKanbanCard from "./customkanban/CustomKanbanCard";
import CardRenderer from "./cards/CardRenderer";

/**
 * The workspace's Kanban surface. Hosts two boards — the user-built Custom
 * Kanban and the agent-driven LLM Kanban. The board switcher (toolbar, left)
 * picks which to show: Default flows both through one continuous left-to-right
 * scroll; Custom / LLM focus one. The Views menu toggles the LLM board between
 * board and list layouts. Search + label filters narrow the LLM board.
 *
 * Only Custom Kanban cards are draggable — they reorder and move between custom
 * columns, or can be dropped onto the LLM To Do column to be filed as an issue.
 * The LLM cards aren't draggable. The shared DndContext lives here so a custom
 * card can cross from one board to the other.
 */
export default function KanbanMainPane() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = dashboard?.projects.find((p) => p.slug === projectSlug);

    const { data: board } = useBoard(activeProject?.id);
    const kanban = useKanbanBoard({ board, projectName: activeProject?.name ?? "" });
    const options = useKanbanOptions();
    const custom = useCustomKanban({
        projectId: activeProject?.id,
        board,
        onSendToBoard: kanban.addIssue,
        getIssue: kanban.findIssue,
        removeIssue: kanban.removeIssue,
    });
    const [boardView, setBoardView] = useState<BoardView>("default");
    const [kanbanView, setKanbanView] = useState<KanbanView>("board");

    const filteredBoard = useMemo(
        () => filterBoard(kanban.board, options.search, options.selectedLabels),
        [kanban.board, options.search, options.selectedLabels],
    );

    const { filter, setFilter } = options;

    // Clear a custom focus whose column was deleted, so the board returns to view.
    useEffect(() => {
        if (filter.kind === "custom" && !custom.columns.some((c) => c.id === filter.columnId)) {
            setFilter({ kind: "default" });
        }
    }, [filter, custom.columns, setFilter]);

    const llmList = <KanbanListView board={filteredBoard} />;

    /**
     * The focus filter view: a single column. The LLM status expands full-width
     * as a grid; a custom column shows as its normal Trello-width list.
     */
    function renderFocus() {
        if (filter.kind === "llm") {
            const column = COLUMNS.find((c) => c.status === filter.status);
            if (!column) return null;
            return (
                <KanbanColumn
                    column={column}
                    issues={filteredBoard[column.status]}
                    layout="grid"
                    fullWidth
                    droppable={isBridgeStatus(column.status)}
                    draggableCards={isBridgeStatus(column.status)}
                />
            );
        }
        if (filter.kind !== "custom") return null;
        const column = custom.columns.find((c) => c.id === filter.columnId);
        if (!column) return null;
        return (
            <CustomKanbanColumn
                column={column}
                onAddCard={(input) => custom.addCard(column.id, input)}
                onDelete={() => custom.removeColumn(column.id)}
                onRename={(label) => custom.renameColumn(column.id, label)}
                onEditCard={custom.editCard}
                onDeleteCard={custom.removeCard}
                projectId={custom.projectId}
                onAssign={custom.assignMember}
                onUnassign={custom.unassignMember}
            />
        );
    }

    function renderBoards() {
        // A focused column takes precedence over the board switcher.
        if (filter.kind !== "default") {
            return (
                <div className="flex min-h-0 flex-1 items-start overflow-hidden px-3 pt-3 pb-3">
                    {renderFocus()}
                </div>
            );
        }

        if (boardView === "custom") {
            return (
                <div className="flex min-h-0 flex-1 items-start gap-4 overflow-x-auto px-3 pt-3 pb-3">
                    <CustomKanbanBoard {...custom} />
                </div>
            );
        }

        if (boardView === "llm") {
            return kanbanView === "list" ? llmList : <KanbanBoardView board={filteredBoard} />;
        }

        // Default: both boards. Board view flows through one continuous scroll
        // row; list view splits (the LLM list isn't a column layout).
        if (kanbanView === "list") {
            return (
                <div className="flex min-h-0 flex-1">
                    <div className="flex min-w-0 flex-1 items-start gap-4 overflow-x-auto px-3 pt-3 pb-3">
                        <CustomKanbanBoard {...custom} />
                    </div>
                    <div className="w-px shrink-0 self-stretch bg-white/8" />
                    <div className="min-w-0 flex-1">{llmList}</div>
                </div>
            );
        }

        return (
            <KanbanBoardView
                board={filteredBoard}
                startAligned
                leading={
                    <>
                        <CustomKanbanBoard {...custom} />
                        <div className="w-px shrink-0 self-stretch bg-white/8" />
                    </>
                }
            />
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <KanbanOptionsBar
                options={options}
                customColumns={custom.columns}
                boardView={boardView}
                onBoardViewChange={setBoardView}
                kanbanView={kanbanView}
                onKanbanViewChange={setKanbanView}
            />
            <DndContext
                sensors={custom.sensors}
                collisionDetection={closestCorners}
                onDragStart={custom.onDragStart}
                onDragOver={custom.onDragOver}
                onDragEnd={custom.onDragEnd}
            >
                {renderBoards()}
                <DragOverlay dropAnimation={null}>
                    {custom.activeItem ? (
                        <div className="w-72 rotate-2 cursor-grabbing shadow-2xl">
                            {custom.activeItem.kind === "custom" ? (
                                <CustomKanbanCard card={custom.activeItem.card} />
                            ) : (
                                <CardRenderer issue={custom.activeItem.issue} />
                            )}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
