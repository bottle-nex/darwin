"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import type { IssueSelectionScope } from "@/store/issues/useIssueSelectionStore";
import type { Issue } from "@/types/kanban";

import CardRenderer from "./cards/CardRenderer";

/**
 * A card that can be picked up and dropped — into another column, or between two
 * cards in this one. While it is being dragged the original dims and the real card
 * follows the cursor through the board's `DragOverlay`.
 */
export default function DraggableIssueCard({
    issue,
    selectionScope,
    draggable,
}: {
    issue: Issue;
    selectionScope: IssueSelectionScope;
    draggable: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: issue.id,
        disabled: !draggable,
    });

    if (!draggable) return <CardRenderer issue={issue} selectionScope={selectionScope} />;

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            {...attributes}
            {...listeners}
            className={cn("cursor-grab touch-none", isDragging && "opacity-40")}
        >
            <CardRenderer issue={issue} selectionScope={selectionScope} />
        </div>
    );
}
