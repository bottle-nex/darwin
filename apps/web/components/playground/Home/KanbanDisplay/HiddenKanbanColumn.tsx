"use client";
import { DropdownCaretIcon } from "@trymatcha/ui/icons";
import { motion, type Variants } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { KanbanColumnDef } from "@/types/kanban";

import LLMIssueStatusTicker from "./LLMIssueStatusTicker";

const HEIGHT_SPRING = { type: "spring", stiffness: 800, damping: 48, mass: 0.6 } as const;

const CONTAINER_VARIANTS: Variants = {
    open: {
        height: "auto",
        transition: { ...HEIGHT_SPRING, staggerChildren: 0.018 },
    },
    closed: {
        height: 0,
        transition: { ...HEIGHT_SPRING, staggerChildren: 0.01, staggerDirection: -1 },
    },
};

const ROW_VARIANTS: Variants = {
    open: { y: 0, transition: { duration: 0.13, ease: [0.4, 0, 0.2, 1] } },
    closed: { y: -4, transition: { duration: 0.08, ease: [0.4, 0, 0.2, 1] } },
};

type HiddenKanbanColumnProps = {
    columns: KanbanColumnDef[];
};

export default function HiddenKanbanColumn({ columns }: HiddenKanbanColumnProps) {
    const [collapsed, setCollapsed] = useState(false);

    if (columns.length === 0) return null;

    return (
        <div className="flex max-h-full min-h-0 w-84 shrink-0 flex-col rounded-lg p-2 transition-colors">
            <button
                type="button"
                aria-expanded={!collapsed}
                aria-label={`${collapsed ? "Expand" : "Collapse"} hidden columns`}
                onClick={() => setCollapsed((c) => !c)}
                className="mb-2 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-left hover:bg-white/5"
            >
                <DropdownCaretIcon
                    className={cn(
                        "size-4 shrink-0 text-neutral-500 transition-all",
                        collapsed && "-rotate-90",
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
            <motion.div
                initial={false}
                animate={collapsed ? "closed" : "open"}
                variants={CONTAINER_VARIANTS}
                className="flex min-h-0 flex-col gap-y-2.25 overflow-hidden"
                aria-hidden={collapsed}
            >
                {columns.map((column) => (
                    <motion.div key={column.status} variants={ROW_VARIANTS}>
                        <HiddenColumnRow column={column} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

function HiddenColumnRow({ column }: { column: KanbanColumnDef }) {
    return (
        <div className="flex items-center gap-1.5 rounded-md bg-snow/5 px-2 py-2 ring-[0.5px] ring-snow/5">
            <LLMIssueStatusTicker status={column.status} className="flex-1" />
            <span className="shrink-0 text-[12px] font-medium text-neutral-500 tabular-nums">
                0
            </span>
        </div>
    );
}
