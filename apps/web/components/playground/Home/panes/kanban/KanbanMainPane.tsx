"use client";
import { closestCorners, DndContext } from "@dnd-kit/core";
import { useKanbanPane } from "./useKanbanPane";
import KanbanOptionsBar from "./KanbanOptionsBar";
import KanbanContent from "./KanbanContent";
import KanbanDragOverlay from "./KanbanDragOverlay";
import IssuePlane from "./Issue/IssuePlane";

/**
 * The workspace's Kanban surface. Hosts two boards — the user-built Custom
 * Kanban and the agent-driven LLM Kanban — under one shared DndContext, so a
 * custom card can be dragged across to the LLM To Do column and back. The toolbar
 * picks which board(s) to show and the layout; `KanbanContent` renders the rest.
 * All the data and view state lives in `useKanbanPane`.
 */
export default function KanbanMainPane() {
    const pane = useKanbanPane();
    const { custom } = pane;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <KanbanOptionsBar
                options={pane.options}
                customColumns={custom.columns}
                boardView={pane.boardView}
                onBoardViewChange={pane.setBoardView}
                kanbanView={pane.kanbanView}
                onKanbanViewChange={pane.setKanbanView}
                onAddTask={() => pane.setIssuePlaneOpen(true)}
            />
            {pane.issuePlaneOpen && (
                <IssuePlane
                    projectId={pane.projectId}
                    onClose={() => pane.setIssuePlaneOpen(false)}
                />
            )}
            <DndContext
                sensors={custom.sensors}
                collisionDetection={closestCorners}
                onDragStart={custom.onDragStart}
                onDragOver={custom.onDragOver}
                onDragEnd={custom.onDragEnd}
            >
                <KanbanContent
                    filter={pane.options.filter}
                    board={pane.board}
                    custom={custom}
                    boardView={pane.boardView}
                    kanbanView={pane.kanbanView}
                />
                <KanbanDragOverlay activeItem={custom.activeItem} />
            </DndContext>
        </div>
    );
}
