"use client";
import { useDroppable } from "@dnd-kit/core";
import { IssueStatus } from "@trymatcha/types";
import { MdAdd, MdChecklist, MdClose, MdMoreHoriz } from "react-icons/md";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoardLaneModel } from "@/hooks/issues/useBoard";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { useCreateIssueStore } from "@/store/issues/useCreateIssueStore";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import type { Issue, KanbanColumnDef } from "@/types/kanban";

import CardRenderer from "./cards/CardRenderer";
import DraggableIssue from "./DraggableIssue";
import LLMIssueStatusTicker from "./LLMIssueStatusTicker";
import VirtualizedIssueCards from "./VirtualizedIssueCards";

type KanbanColumnProps = {
    column: KanbanColumnDef;
    issues: Issue[];
    layout?: "list" | "grid";
    fullWidth?: boolean;
    droppable?: boolean;
    draggableCards?: boolean;
};

export default function KanbanColumn({
    column,
    issues,
    layout = "list",
    fullWidth = false,
    droppable = false,
    draggableCards = false,
}: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id: column.status, disabled: !droppable });
    const openCreate = useCreateIssueStore((s) => s.open);
    const selectedIds = useIssueSelectionStore((s) => s.ids);
    const replaceSelection = useIssueSelectionStore((s) => s.replace);
    const clearSelection = useIssueSelectionStore((s) => s.clear);
    const projectId = useActiveProject()?.id;
    const dragActive = useKanbanBoardStore((state) => state.overlayActive);
    const lane = useBoardLaneModel(projectId, { type: "system", status: column.status });
    const { title } = column;
    const grid = layout === "grid";
    const canAddCard = column.status === IssueStatus.Todo;
    const fallbackPagination = lane.source === "fallback";

    return (
        <div
            data-column-status={column.status}
            className={cn(
                "group flex max-h-full min-h-0 flex-col rounded-lg bg-ink/20 ring-[0.5px] ring-snow/3 p-2 transition-colors",
                fullWidth ? "min-w-0 flex-1" : "w-84 shrink-0",
            )}
        >
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                <LLMIssueStatusTicker status={column.status} count={issues.length} />
                <div className="flex items-center gap-1">
                    {canAddCard && (
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={() => openCreate({ board: "llm" })}
                            aria-label={`Add an issue to ${title}`}
                            className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100"
                        >
                            <MdAdd className="size-4" aria-hidden />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="unstyled"
                                type="button"
                                aria-label={`${title} options`}
                                className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                            >
                                <MdMoreHoriz className="size-4" aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                                disabled={issues.length === 0}
                                onSelect={() =>
                                    replaceSelection(
                                        "kanban",
                                        issues.map((issue) => issue.id),
                                    )
                                }
                            >
                                <MdChecklist className="size-3.5" aria-hidden />
                                <span className="flex-1">Select loaded issues</span>
                                <span className="text-[11px] text-neutral-500">
                                    {issues.length}
                                </span>
                            </DropdownMenuItem>

                            {selectedIds.length > 0 && (
                                <DropdownMenuItem onSelect={clearSelection}>
                                    <MdClose className="size-3.5" aria-hidden />
                                    <span className="flex-1">Clear selection</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <VirtualizedIssueCards
                items={issues}
                knownTotal={lane.source === "base" ? lane.serverTotal : undefined}
                columns={grid ? "responsive" : 1}
                estimateSize={156}
                className="min-h-0 flex-1 rounded-lg p-0.5 no-scrollbar"
                scrollElementRef={setNodeRef}
                dataColumnList={column.status}
                renderItem={(issue) =>
                    draggableCards ? (
                        <DraggableIssue issue={issue} />
                    ) : (
                        <CardRenderer issue={issue} />
                    )
                }
                status={{
                    label: lane.fallbackPending
                        ? `Searching all issues in ${title}`
                        : lane.lanePending
                          ? `Loading issues in ${title}`
                          : lane.laneError || lane.basePageError || lane.fallbackError
                            ? `Issues in ${title} could not be loaded.`
                            : issues.length === 0
                              ? `No issues in ${title}`
                              : `${issues.length} loaded issues in ${title}`,
                }}
                autoFill={{
                    key: `${column.status}:${lane.source}`,
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
                    canAddCard ? (
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={() => openCreate({ board: "llm" })}
                            className="mt-2 flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] px-2 py-1.5 text-center text-[13px] font-medium text-neutral-400 opacity-0 transition-opacity hover:bg-white/5 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100"
                        >
                            <MdAdd className="size-3.5" aria-hidden />
                            Add an Issue
                        </Button>
                    ) : undefined
                }
            />
        </div>
    );
}
