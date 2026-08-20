"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MdMoreHoriz, MdAdd, MdDelete, MdEdit, MdDragIndicator } from "react-icons/md";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MatchaLogo } from "@/components/logo/MatchaLogo";
import { useIssueStore } from "@/store/issues/useIssueStore";
import { useCustomColumnActions } from "@/hooks/kanban/useCustomColumnActions";
import SortableCustomCard from "./SortableCustomCard";
import type { CustomColumn } from "@/types/kanban-custom";

type CustomKanbanColumnProps = {
    column: CustomColumn;
    draggable?: boolean;
};

export default function CustomKanbanColumn({ column, draggable = true }: CustomKanbanColumnProps) {
    const openCreate = useIssueStore((s) => s.openCreate);
    const { removeColumn, renameColumn } = useCustomColumnActions();

    const [renaming, setRenaming] = useState(false);
    const [draftTitle, setDraftTitle] = useState(column.title);
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id });

    const style = { transform: CSS.Transform.toString(transform), transition };

    const commitRename = () => {
        const next = draftTitle.trim();
        if (next && next !== column.title) renameColumn(column.id, next);
        setRenaming(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex max-h-full min-h-0 w-84 shrink-0 flex-col self-stretch rounded-lg bg-ink/20 p-2 ring-1 ring-snow/3 transition-colors",
                isDragging && "opacity-40",
            )}
        >
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                {draggable && (
                    <Button
                        variant="unstyled"
                        type="button"
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                        aria-label={`Reorder ${column.title}`}
                        className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-neutral-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-300 group-hover:opacity-100 active:cursor-grabbing"
                    >
                        <MdDragIndicator className="size-4" aria-hidden />
                    </Button>
                )}
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
                        className="h-7 text-[12px] bg-charcoal hover:bg-charcoal rounded-sm shadow-none!"
                    />
                ) : (
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-neutral-200">
                        <span>{column.title}</span>
                        <span className="text-[11px] font-medium opacity-60">
                            {column.cards.length}
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() =>
                            openCreate({
                                board: "custom",
                                columnId: column.id,
                                columnTitle: column.title,
                            })
                        }
                        aria-label={`Add an issue to ${column.title}`}
                        className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100"
                    >
                        <MdAdd className="size-4" aria-hidden />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="unstyled"
                                type="button"
                                aria-label={`${column.title} options`}
                                className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                            >
                                <MdMoreHoriz className="size-4" aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                                onSelect={() => {
                                    setDraftTitle(column.title);
                                    setRenaming(true);
                                }}
                            >
                                <MdEdit className="size-3.5" aria-hidden />
                                <span className="flex-1">Rename list</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onSelect={() => removeColumn(column.id)}
                                variant="destructive"
                            >
                                <MdDelete className="size-3.5" aria-hidden />
                                <span className="flex-1">Delete list</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <SortableContext
                items={column.cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    data-lenis-prevent
                    className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-0.5 no-scrollbar"
                >
                    {column.cards.map((card) => (
                        <SortableCustomCard key={card.id} card={card} />
                    ))}

                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() =>
                            openCreate({
                                board: "custom",
                                columnId: column.id,
                                columnTitle: column.title,
                            })
                        }
                        className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] px-2 py-1.5 text-center text-[13px] font-medium text-neutral-400 opacity-0 transition-opacity hover:bg-white/5 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100"
                    >
                        <MdAdd className="size-3.5" aria-hidden />
                        Add a card
                    </Button>

                    {column.cards.length === 0 && (
                        <div className="flex h-full flex-col items-center justify-center gap-2 px-2">
                            <MatchaLogo className="h-6 w-auto text-neutral-800" />
                            <p className="text-[12px] text-neutral-600">No issues currently</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
