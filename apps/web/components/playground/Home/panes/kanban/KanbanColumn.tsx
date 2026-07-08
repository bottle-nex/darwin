"use client";
import { MdMoreHoriz } from "react-icons/md";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Issue, KanbanColumnDef } from "./types";
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
    const { setNodeRef, isOver } = useDroppable({ id: column.status, disabled: !droppable });
    const { title } = column;
    const grid = layout === "grid";

    return (
        <div
            className={cn(
                "group flex max-h-full min-h-0 flex-col rounded-xl bg-white/2.5 p-2 ring-1 transition-colors",
                fullWidth ? "min-w-0 flex-1" : "w-72 shrink-0",
                droppable && isOver ? "ring-white/15" : "ring-white/5",
            )}
        >
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                <LLMIssueStatusTicker status={column.status} count={issues.length} />
                <button
                    type="button"
                    aria-label={`${title} options`}
                    className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100"
                >
                    <MdMoreHoriz className="size-4" aria-hidden />
                </button>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto rounded-lg p-0.5",
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

                {issues.length === 0 && (
                    <p
                        className={cn(
                            "text-center text-[12px] text-neutral-600",
                            grid ? "col-span-full py-6" : "px-2 py-6",
                        )}
                    >
                        No issues
                    </p>
                )}
            </div>
        </div>
    );
}
