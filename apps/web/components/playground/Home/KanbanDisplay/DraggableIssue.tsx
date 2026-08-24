"use client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import type { Issue } from "@/types/kanban";

import CardRenderer from "./cards/CardRenderer";

/**
 * Draggable wrapper for a To Do issue — the only LLM cards a user can move. It
 * can be dragged onto a Custom Kanban column (where it becomes a custom card);
 * while dragging, the original dims and the real card follows the cursor via the
 * board's `DragOverlay`.
 */
export default function DraggableIssue({ issue }: { issue: Issue }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: issue.id,
    });

    const style = { transform: CSS.Translate.toString(transform) };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn("cursor-grab touch-none", isDragging && "opacity-40")}
        >
            <CardRenderer issue={issue} />
        </div>
    );
}
