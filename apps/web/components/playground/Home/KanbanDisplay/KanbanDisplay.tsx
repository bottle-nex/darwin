"use client";
import { closestCorners, DndContext } from "@dnd-kit/core";
import { useKanbanPane } from "@/hooks/kanban/useKanbanPane";
import OptionsBar from "./OptionsBar/OptionsBar";
import KanbanContent from "./KanbanContent";
import KanbanDragOverlay from "./KanbanDragOverlay";
import { useCreateOrEditIssueStore } from "@/store/issues/useCreateOrEditIssueStore";

/**
 * The workspace's Kanban surface. Hosts two boards — the user-built Custom
 * Kanban and the agent-driven LLM Kanban — under one shared DndContext, so a
 * custom card can be dragged across to the LLM To Do column and back. The toolbar
 * picks which board(s) to show and the layout; `KanbanContent` renders the rest.
 * All the data and view state lives in `useKanbanPane`.
 */
export default function KanbanDisplay() {
    const pane = useKanbanPane();
    const { custom } = pane;
    const openCreate = useCreateOrEditIssueStore((s) => s.openCreate);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <OptionsBar
                options={pane.options}
                customColumns={custom.columns}
                boardView={pane.boardView}
                onBoardViewChange={pane.setBoardView}
                kanbanView={pane.kanbanView}
                onKanbanViewChange={pane.setKanbanView}
                onAddTask={() => openCreate({ board: "llm" })}
            />
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
