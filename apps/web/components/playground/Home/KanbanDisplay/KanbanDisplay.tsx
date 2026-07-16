"use client";
import { closestCorners, DndContext } from "@dnd-kit/core";
import { useKanbanPane } from "@/hooks/kanban/useKanbanPane";
import OptionsBar from "./OptionsBar/OptionsBar";
import KanbanContent from "./KanbanContent";
import KanbanDragOverlay from "./KanbanDragOverlay";
import IssueFlightTrigger from "./flight/IssueFlightTrigger";
import IssueFlightOverlay from "./flight/IssueFlightOverlay";
import AddCustomColumnDialog from "./customkanban/AddCustomColumnDialog";

/**
 * The workspace's Kanban surface. Hosts two boards — the user-built Custom
 * Kanban and the agent-driven LLM Kanban — under one shared DndContext, so a
 * custom card can be dragged across to the LLM To Do column and back. Board and
 * toolbar data lives in Zustand stores (`store/kanban/`) that each component
 * reads directly; `useKanbanPane` only wires the data sources (project, board
 * query, store seeding) and the Custom Kanban's drag-and-drop actions.
 */
export default function KanbanDisplay() {
    const { custom } = useKanbanPane();

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <OptionsBar />
            <DndContext
                sensors={custom.sensors}
                collisionDetection={closestCorners}
                onDragStart={custom.onDragStart}
                onDragOver={custom.onDragOver}
                onDragEnd={custom.onDragEnd}
            >
                <KanbanContent custom={custom} />
                <KanbanDragOverlay />
            </DndContext>
            <IssueFlightTrigger />
            <IssueFlightOverlay />
            <AddCustomColumnDialog onAdd={custom.addColumn} />
        </div>
    );
}
