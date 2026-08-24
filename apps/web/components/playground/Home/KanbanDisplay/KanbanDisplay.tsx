"use client";
import { closestCorners, DndContext } from "@dnd-kit/core";

import { BoardDataLoader, BoardFeedProvider } from "@/hooks/issues/useBoard";
import { useKanbanPane } from "@/hooks/kanban/useKanbanPane";
import { useActiveProject } from "@/hooks/useActiveProject";

import AddCustomColumnDialog from "./customkanban/AddCustomColumnDialog";
import KanbanContent from "./KanbanContent";
import KanbanDragOverlay from "./KanbanDragOverlay";
import KanbanOptionsBar from "./OptionsBar/KanbanOptionsBar";

export default function KanbanDisplay() {
    const projectId = useActiveProject()?.id;

    return (
        <BoardFeedProvider projectId={projectId}>
            <KanbanDisplayContent projectId={projectId} />
        </BoardFeedProvider>
    );
}

function KanbanDisplayContent({ projectId }: { projectId: string | undefined }) {
    const { dnd } = useKanbanPane();

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <BoardDataLoader projectId={projectId} />
            <KanbanOptionsBar />
            <DndContext
                sensors={dnd.sensors}
                collisionDetection={closestCorners}
                onDragStart={dnd.onDragStart}
                onDragOver={dnd.onDragOver}
                onDragEnd={dnd.onDragEnd}
                onDragCancel={dnd.onDragCancel}
            >
                <KanbanContent />
                <KanbanDragOverlay />
            </DndContext>
            <AddCustomColumnDialog />
        </div>
    );
}
