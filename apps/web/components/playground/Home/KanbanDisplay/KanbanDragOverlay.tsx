"use client";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { DragOverlay } from "@dnd-kit/core";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import CustomKanbanCard from "./customkanban/CustomKanbanCard";
import CardRenderer from "./cards/CardRenderer";

const emptySubscribe = () => () => {};

// Returns false during SSR and the first hydration pass, true once on the client.
// Guards createPortal, which needs document.body, without setState-in-effect.
function useIsClient() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}

/**
 * The card that follows the cursor while dragging. It reuses the real card
 * components so the lifted card looks identical to the resting one — a custom
 * card or an LLM issue depending on what's being dragged.
 *
 * Portaled to `document.body`: `DragOverlay` positions itself with `position:
 * fixed` relative to the viewport, but `PlaygroundDisplay`'s `backdrop-blur-md`
 * ancestor establishes a CSS containing block for fixed descendants, which
 * would otherwise throw the overlay's position off from the cursor.
 */
export default function KanbanDragOverlay() {
    const activeItem = useCustomKanbanStore((s) => s.activeItem);
    const isClient = useIsClient();

    if (!isClient) return null;

    return createPortal(
        <DragOverlay dropAnimation={null}>
            {activeItem ? (
                activeItem.kind === "column" ? (
                    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-white/2.5 p-1 ring-1 ring-white/15 rotate-2 cursor-grabbing shadow-2xl">
                        <div className="flex items-center gap-2 px-0.5">
                            <div className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-neutral-200">
                                <span>{activeItem.column.title}</span>
                                <span className="text-[11px] font-medium opacity-60">
                                    {activeItem.column.cards.length}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-72 rotate-2 cursor-grabbing shadow-2xl">
                        {activeItem.kind === "custom" ? (
                            <CustomKanbanCard card={activeItem.card} />
                        ) : (
                            <CardRenderer issue={activeItem.issue} />
                        )}
                    </div>
                )
            ) : null}
        </DragOverlay>,
        document.body,
    );
}
