"use client";
import { Button } from "@/components/ui/button";
import { MdAdd, MdChecklist, MdClose, MdMoreHoriz } from "react-icons/md";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { IssueStatus } from "@trymatcha/types";
import { useIssueStore } from "@/store/issues/useIssueStore";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";
import { MatchaLogo } from "@/components/logo/MatchaLogo";
import type { Issue, KanbanColumnDef } from "@/types/kanban";
import CardRenderer from "./cards/CardRenderer";
import DraggableIssue from "./DraggableIssue";
import LLMIssueStatusTicker from "./LLMIssueStatusTicker";

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
    const openCreate = useIssueStore((s) => s.openCreate);
    const selectedIds = useIssueSelectionStore((s) => s.ids);
    const replaceSelection = useIssueSelectionStore((s) => s.replace);
    const clearSelection = useIssueSelectionStore((s) => s.clear);
    const { title } = column;
    const grid = layout === "grid";
    const canAddCard = column.status === IssueStatus.Todo;

    return (
        <div
            data-column-status={column.status}
            className={cn(
                "group flex max-h-full min-h-0 flex-col self-stretch rounded-lg bg-ink/20 ring-1 ring-snow/3 p-2 transition-colors",
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
                                <span className="flex-1">Select issues</span>
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

            <div
                data-lenis-prevent
                data-column-list={column.status}
                ref={setNodeRef}
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto rounded-lg p-0.5 no-scrollbar",
                    grid
                        ? "grid grid-cols-1 content-start gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "flex flex-col gap-2",
                )}
            >
                {issues.map((issue) =>
                    draggableCards ? (
                        <DraggableIssue key={issue.id} issue={issue} />
                    ) : (
                        <CardRenderer key={issue.id} issue={issue} />
                    ),
                )}

                {canAddCard && (
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => openCreate({ board: "llm" })}
                        className={cn(
                            "flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] px-2 py-1.5 text-center text-[13px] font-medium text-neutral-400 opacity-0 transition-opacity hover:bg-white/5 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100",
                            grid && "col-span-full",
                        )}
                    >
                        <MdAdd className="size-3.5" aria-hidden />
                        Add an Issue
                    </Button>
                )}

                {issues.length === 0 && (
                    <div
                        className={cn(
                            "flex flex-1 h-full flex-col items-center justify-center gap-2",
                            grid ? "col-span-full" : "px-2",
                        )}
                    >
                        <MatchaLogo className="h-6 w-auto text-neutral-800" />
                        <p className="text-[12px] text-neutral-600">No issues currently</p>
                    </div>
                )}
            </div>
        </div>
    );
}
