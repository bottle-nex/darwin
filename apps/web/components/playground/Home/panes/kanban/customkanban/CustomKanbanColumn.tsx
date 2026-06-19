"use client";
import { useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { PANEL_CONTENT, PANEL_ITEM } from "../KanbanOptionPanels/panelStyles";
import AddCardModal from "./AddCardModal";
import SortableCustomCard from "./SortableCustomCard";
import type { CustomColumn, NewCardInput } from "./types";

type CustomKanbanColumnProps = {
    column: CustomColumn;
    onAddCard: (input: NewCardInput) => void;
    onDelete: () => void;
};

/**
 * A user-built column: a title header with a card count and a ⋯ menu to delete
 * the list, its stacked cards, and an "Add a card" button that opens the
 * centered Add Card modal. Fixed Trello-width; sizes to its content and only
 * scrolls its cards once it outgrows the board height.
 */
export default function CustomKanbanColumn({
    column,
    onAddCard,
    onDelete,
}: CustomKanbanColumnProps) {
    const [adding, setAdding] = useState(false);
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div
            className={cn(
                "group flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-white/2.5 p-2 ring-1 transition-colors",
                isOver ? "ring-white/15" : "ring-white/5",
            )}
        >
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                <div className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-neutral-200">
                    <span>{column.title}</span>
                    <span className="text-[11px] font-medium opacity-60">
                        {column.cards.length}
                    </span>
                </div>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button
                            type="button"
                            aria-label={`${column.title} options`}
                            className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                        >
                            <MoreHorizontal className="size-4" aria-hidden />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={6}
                            className={`w-44 ${PANEL_CONTENT}`}
                        >
                            <DropdownMenu.Item
                                onSelect={onDelete}
                                className={`${PANEL_ITEM} text-rose-300 data-highlighted:text-rose-200`}
                            >
                                <Trash2 className="size-3.5" aria-hidden />
                                <span className="flex-1">Delete list</span>
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>

            <SortableContext
                items={column.cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={setNodeRef}
                    className="flex min-h-10 flex-col gap-2 overflow-y-auto rounded-lg p-0.5"
                >
                    {column.cards.map((card) => (
                        <SortableCustomCard key={card.id} card={card} />
                    ))}
                </div>
            </SortableContext>

            <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200 cursor-pointer"
            >
                <Plus className="size-3.5" aria-hidden />
                Add a card
            </button>

            <AddCardModal
                open={adding}
                onOpenChange={setAdding}
                columnTitle={column.title}
                onSubmit={onAddCard}
            />
        </div>
    );
}
