"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Issue } from "./types";
import CardRenderer from "./cards/CardRenderer";

/**
 * Draggable wrapper around a card. Owns the dnd-kit sortable wiring; while a card
 * is being dragged the original is dimmed to a placeholder and the real card
 * follows the cursor via the board's `DragOverlay` (which lives in a portal, so
 * it isn't clipped by the column's scroll area).
 */
export default function SortableIssue({ issue }: { issue: Issue }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: issue.id,
    });

    const style = { transform: CSS.Transform.toString(transform), transition };

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
