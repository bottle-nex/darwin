"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import CustomKanbanCard from "./CustomKanbanCard";
import type { CustomCard } from "./types";

/**
 * Draggable wrapper around a Custom Kanban card. The card can be reordered and
 * moved between custom columns, or dragged onto the LLM To Do column; while
 * dragging, the original dims and the real card follows the cursor via the
 * board's `DragOverlay`.
 */
export default function SortableCustomCard({ card }: { card: CustomCard }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card.id,
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
            <CustomKanbanCard card={card} />
        </div>
    );
}
