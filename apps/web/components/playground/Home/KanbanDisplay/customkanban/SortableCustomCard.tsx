"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import CustomKanbanCard from "./CustomKanbanCard";
import type { CustomCard } from "@/types/kanban-custom";

type SortableCustomCardProps = {
    card: CustomCard;
    onDelete?: () => void;
    projectId?: string;
    onAssign?: (userId: string) => void;
    onUnassign?: (userId: string) => void;
};

export default function SortableCustomCard({
    card,
    onDelete,
    projectId,
    onAssign,
    onUnassign,
}: SortableCustomCardProps) {
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
            <CustomKanbanCard
                card={card}
                onDelete={onDelete}
                projectId={projectId}
                onAssign={onAssign}
                onUnassign={onUnassign}
            />
        </div>
    );
}
