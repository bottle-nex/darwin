"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import type { CustomCard } from "@/types/kanban-custom";

import CustomKanbanCard from "./CustomKanbanCard";

type SortableCustomCardProps = {
    card: CustomCard;
};

export default function SortableCustomCard({ card }: SortableCustomCardProps) {
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
