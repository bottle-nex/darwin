"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
    MdMoreHoriz,
    MdAdd,
    MdDelete,
    MdEdit,
    MdDragIndicator,
    MdChecklist,
    MdClose,
} from "react-icons/md";
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
import { useCreateIssueStore } from "@/store/issues/useCreateIssueStore";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";
import { useCustomColumnActions } from "@/hooks/kanban/useCustomColumnActions";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoardLaneModel } from "@/hooks/issues/useBoard";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import SortableCustomCard from "./SortableCustomCard";
import { BoardLanePaginationView } from "../BoardLanePagination";
import VirtualizedIssueCards from "../VirtualizedIssueCards";
import type { CustomColumn } from "@/types/kanban-custom";

type CustomKanbanColumnProps = {
    column: CustomColumn;
    draggable?: boolean;
};

export default function CustomKanbanColumn({ column, draggable = true }: CustomKanbanColumnProps) {
    const openCreate = useCreateIssueStore((s) => s.open);
    const hasSelection = useIssueSelectionStore(
        (state) => state.scope === "custom-kanban" && state.ids.length > 0,
    );
    const replaceSelection = useIssueSelectionStore((state) => state.replace);
    const clearSelection = useIssueSelectionStore((state) => state.clear);
    const projectId = useActiveProject()?.id;
    const dragActive = useCustomKanbanStore((state) => state.overlayActive);
    const lane = useBoardLaneModel(projectId, { type: "custom", columnId: column.id });
    const fallbackPagination = lane.source === "fallback";
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
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                                disabled={column.cards.length === 0}
                                onSelect={() =>
                                    replaceSelection(
                                        "custom-kanban",
                                        column.cards.map((card) => card.id),
                                    )
                                }
                            >
                                <MdChecklist className="size-3.5" aria-hidden />
                                <span className="flex-1">Select loaded issues</span>
                                <span className="text-[11px] text-neutral-500">
                                    {column.cards.length}
                                </span>
                            </DropdownMenuItem>

                            {hasSelection && (
                                <DropdownMenuItem onSelect={clearSelection}>
                                    <MdClose className="size-3.5" aria-hidden />
                                    <span className="flex-1">Clear selection</span>
                                </DropdownMenuItem>
                            )}

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
                <VirtualizedIssueCards
                    items={column.cards}
                    knownTotal={lane.source === "base" ? lane.serverTotal : undefined}
                    estimateSize={156}
                    className="min-h-0 flex-1 rounded-lg p-0.5 no-scrollbar"
                    renderItem={(card) => <SortableCustomCard card={card} />}
                    status={{
                        label: lane.fallbackPending
                            ? `Searching all issues in ${column.title}`
                            : lane.lanePending
                              ? `Loading issues in ${column.title}`
                              : lane.laneError || lane.basePageError || lane.fallbackError
                                ? `Issues in ${column.title} could not be loaded. Retry is available.`
                                : column.cards.length === 0
                                  ? `No issues in ${column.title}`
                                  : `${column.cards.length} loaded issues in ${column.title}`,
                    }}
                    autoFill={{
                        key: `${column.id}:${lane.source}`,
                        hasNextPage: Boolean(
                            fallbackPagination ? lane.hasNextFallbackPage : lane.hasNextBasePage,
                        ),
                        fetchingNextPage: fallbackPagination
                            ? lane.isFetchingNextFallbackPage
                            : lane.isFetchingNextBasePage,
                        pageError: fallbackPagination
                            ? lane.fallbackError
                            : lane.laneError || lane.basePageError,
                        paused: dragActive,
                        onLoadMore: () =>
                            fallbackPagination
                                ? lane.fetchNextFallbackPage()
                                : lane.fetchNextBasePage(),
                    }}
                    footer={
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
                    }
                    emptyState={
                        <div className="flex min-h-32 flex-col items-center justify-center gap-2 px-2">
                            <MatchaLogo className="h-6 w-auto text-neutral-800" />
                            <p className="text-[12px] text-neutral-600">
                                {lane.lanePending || lane.fallbackPending
                                    ? "Loading issues…"
                                    : lane.laneError || lane.fallbackError
                                      ? "Couldn’t load issues"
                                      : "No issues currently"}
                            </p>
                        </div>
                    }
                />
            </SortableContext>
            <BoardLanePaginationView lane={lane} />
        </div>
    );
}
