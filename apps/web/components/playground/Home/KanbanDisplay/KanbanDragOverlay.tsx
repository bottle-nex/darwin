"use client";
import { DragOverlay } from "@dnd-kit/core";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";

import CardRenderer from "./cards/CardRenderer";
import CustomKanbanCard from "./customkanban/CustomKanbanCard";

const emptySubscribe = () => () => {};

function useIsClient() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}

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
                            <CustomKanbanCard card={activeItem.card} preview />
                        ) : (
                            <CardRenderer issue={activeItem.issue} preview />
                        )}
                    </div>
                )
            ) : null}
        </DragOverlay>,
        document.body,
    );
}
