"use client";
import { useState } from "react";
import { MdMoreHoriz, MdAdd, MdDelete, MdEdit } from "react-icons/md";
import { DropdownMenu } from "radix-ui";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PANEL_CONTENT, PANEL_ITEM } from "../OptionsBar/KanbanOptionPanels/panelStyles";
import { useCreateOrEditIssueStore } from "@/store/issues/useCreateOrEditIssueStore";
import SortableCustomCard from "./SortableCustomCard";
import type { CustomColumn } from "@/types/kanban-custom";

type CustomKanbanColumnProps = {
    column: CustomColumn;
    onDelete: () => void;
    onRename: (label: string) => void;
    onDeleteCard: (cardId: string) => void;
    projectId?: string;
    onAssign: (cardId: string, userId: string) => void;
    onUnassign: (cardId: string, userId: string) => void;
};

export default function CustomKanbanColumn({
    column,
    onDelete,
    onRename,
    onDeleteCard,
    projectId,
    onAssign,
    onUnassign,
}: CustomKanbanColumnProps) {
    const openCreate = useCreateOrEditIssueStore((s) => s.openCreate);

    const [renaming, setRenaming] = useState(false);
    const [draftTitle, setDraftTitle] = useState(column.title);
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    const commitRename = () => {
        const next = draftTitle.trim();
        if (next && next !== column.title) onRename(next);
        setRenaming(false);
    };

    return (
        <div
            className={cn(
                "group flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-white/2.5 p-1 ring-1 transition-colors",
                isOver ? "ring-white/15" : "ring-white/5",
            )}
        >
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                {renaming ? (
                    <Input
                        autoFocus
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                commitRename();
                            } else if (e.key === "Escape") {
                                setDraftTitle(column.title);
                                setRenaming(false);
                            }
                        }}
                        className="h-7 text-[12px]"
                    />
                ) : (
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-neutral-200">
                        <span>{column.title}</span>
                        <span className="text-[11px] font-medium opacity-60">
                            {column.cards.length}
                        </span>
                    </div>
                )}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button
                            type="button"
                            aria-label={`${column.title} options`}
                            className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                        >
                            <MdMoreHoriz className="size-4" aria-hidden />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={6}
                            className={`w-44 ${PANEL_CONTENT}`}
                        >
                            <DropdownMenu.Item
                                onSelect={() => {
                                    setDraftTitle(column.title);
                                    setRenaming(true);
                                }}
                                className={PANEL_ITEM}
                            >
                                <MdEdit className="size-3.5" aria-hidden />
                                <span className="flex-1">Rename list</span>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                                onSelect={onDelete}
                                className={`${PANEL_ITEM} text-rose-300 data-highlighted:text-rose-200`}
                            >
                                <MdDelete className="size-3.5" aria-hidden />
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
                    className="flex min-h-10 flex-col gap-1.5 overflow-y-auto rounded-lg p-0.5"
                >
                    {column.cards.map((card) => (
                        <SortableCustomCard
                            key={card.id}
                            card={card}
                            onDelete={() => onDeleteCard(card.id)}
                            projectId={projectId}
                            onAssign={(userId) => onAssign(card.id, userId)}
                            onUnassign={(userId) => onUnassign(card.id, userId)}
                        />
                    ))}
                </div>
            </SortableContext>

            <button
                type="button"
                onClick={() =>
                    openCreate({
                        board: "custom",
                        columnId: column.id,
                        columnTitle: column.title,
                    })
                }
                className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200 cursor-pointer"
            >
                <MdAdd className="size-3.5" aria-hidden />
                Add a card
            </button>
        </div>
    );
}
