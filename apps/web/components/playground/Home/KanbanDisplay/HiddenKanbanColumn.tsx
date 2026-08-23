"use client";
import { useState } from "react";
import { MdArrowRight } from "react-icons/md";
import { cn } from "@/lib/utils";
import type { KanbanColumnDef } from "@/types/kanban";
import LLMIssueStatusTicker from "./LLMIssueStatusTicker";

type HiddenKanbanColumnProps = {
    columns: KanbanColumnDef[];
};

export default function HiddenKanbanColumn({ columns }: HiddenKanbanColumnProps) {
    const [collapsed, setCollapsed] = useState(false);

    if (columns.length === 0) return null;

    return (
        <div className="flex max-h-full min-h-0 w-84 shrink-0 flex-col rounded-lg bg-ink/20 ring-1 ring-snow/3 p-2 transition-colors">
            <button
                type="button"
                aria-expanded={!collapsed}
                aria-label={`${collapsed ? "Expand" : "Collapse"} hidden columns`}
                onClick={() => setCollapsed((c) => !c)}
                className="mb-2 flex cursor-pointer items-center gap-1.5 rounded-md px-0.5 py-1 text-left hover:bg-white/5"
            >
                <MdArrowRight
                    className={cn(
                        "size-4 shrink-0 text-neutral-500 transition-all",
                        !collapsed && "rotate-90",
                    )}
                    aria-hidden
                />
                <span className="flex-1 truncate text-[12px] font-semibold text-neutral-200">
                    Hidden columns
                </span>
                <span className="shrink-0 text-[11px] font-medium opacity-60">
                    {columns.length}
                </span>
            </button>
            {!collapsed && (
                <div className="flex min-h-0 flex-col gap-y-2.25 overflow-y-auto">
                    {columns.map((column) => (
                        <HiddenColumnRow key={column.status} column={column} />
                    ))}
                </div>
            )}
        </div>
    );
}

function HiddenColumnRow({ column }: { column: KanbanColumnDef }) {
    return (
        <div className="flex items-center gap-1.5 rounded-md bg-snow/5 px-2 py-2 ring-[0.5px] ring-snow/5 hover:bg-snow/8">
            <LLMIssueStatusTicker status={column.status} className="flex-1" />
            <span className="shrink-0 text-[12px] font-medium text-neutral-500 tabular-nums">
                0
            </span>
        </div>
    );
}
