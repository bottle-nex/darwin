"use client";
import { DragOverlay } from "@dnd-kit/core";
import type { CustomKanbanApi } from "./customkanban/useCustomKanban";
import CustomKanbanCard from "./customkanban/CustomKanbanCard";
import CardRenderer from "./cards/CardRenderer";

type KanbanDragOverlayProps = {
    /** The item currently being dragged, or null when nothing is. */
    activeItem: CustomKanbanApi["activeItem"];
};

/**
 * The card that follows the cursor while dragging. It reuses the real card
 * components so the lifted card looks identical to the resting one — a custom
 * card or an LLM issue depending on what's being dragged.
 */
export default function KanbanDragOverlay({ activeItem }: KanbanDragOverlayProps) {
    return (
        <DragOverlay dropAnimation={null}>
            {activeItem ? (
                <div className="w-72 rotate-2 cursor-grabbing shadow-2xl">
                    {activeItem.kind === "custom" ? (
                        <CustomKanbanCard card={activeItem.card} />
                    ) : (
                        <CardRenderer issue={activeItem.issue} />
                    )}
                </div>
            ) : null}
        </DragOverlay>
    );
}
