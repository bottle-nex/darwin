"use client";

import type { IconType } from "@trydarwin/ui/icons";
import {
    AttachmentCountIcon,
    OverflowMenuIcon,
    ShowcaseDueDateIcon,
    ShowcaseKanbanViewIcon,
    ShowcaseListViewIcon,
    ShowcaseSubtaskCountIcon,
    ShowcaseTimelineViewIcon,
} from "@trydarwin/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { memo, useState } from "react";

import { cn } from "@/lib/utils";

import { appear, EASE_OUT, MockScene, PanelCard } from "./MockWindow";
import ShowcaseFrame from "./ShowcaseFrame";

const BOARD_GLASS = { angle: 0, size: 0.5 };

type BoardMode = "custom" | "llm";

const BOARD_MODES: { value: BoardMode; label: string }[] = [
    { value: "llm", label: "LLM" },
    { value: "custom", label: "Custom" },
];

const VIEW_TABS: { label: string; icon: IconType; active?: boolean }[] = [
    { label: "Kanban", icon: ShowcaseKanbanViewIcon, active: true },
    { label: "List", icon: ShowcaseListViewIcon },
    { label: "Timeline", icon: ShowcaseTimelineViewIcon },
];

type Task = {
    priority: string;
    priorityClass: string;
    dotClass: string;
    category: string;
    categoryClass: string;
    title: string;
    subtasks: number;
    files: number;
    due: string;
};

type BoardColumn = { name: string; barClass: string; tasks: Task[] };

const MEDIUM = {
    priority: "Medium",
    priorityClass: "bg-amber-500/12 text-amber-700",
    dotClass: "bg-amber-500",
};
const HIGH = {
    priority: "High",
    priorityClass: "bg-rose-500/12 text-rose-700",
    dotClass: "bg-rose-500",
};
const LOW = {
    priority: "Low",
    priorityClass: "bg-sky-500/12 text-sky-700",
    dotClass: "bg-sky-500",
};

/** The board the agents run: statuses managed by the LLM pipeline. */
const LLM_COLUMNS: BoardColumn[] = [
    {
        name: "To Do",
        barClass: "bg-sky-500",
        tasks: [
            {
                ...MEDIUM,
                category: "Research",
                categoryClass: "bg-teal-500/12 text-teal-700",
                title: "Define KPI list for Q2",
                subtasks: 18,
                files: 3,
                due: "4 days",
            },
            {
                ...LOW,
                category: "Design",
                categoryClass: "bg-purple-500/12 text-purple-700",
                title: "Refine onboarding checklist",
                subtasks: 4,
                files: 1,
                due: "6 days",
            },
        ],
    },
    {
        name: "In Progress",
        barClass: "bg-blue-500",
        tasks: [
            {
                ...MEDIUM,
                category: "Saas",
                categoryClass: "bg-blue-500/12 text-blue-700",
                title: "Create wireframes",
                subtasks: 6,
                files: 6,
                due: "2 days",
            },
            {
                ...HIGH,
                category: "Backend",
                categoryClass: "bg-emerald-500/12 text-emerald-700",
                title: "API error dashboard",
                subtasks: 12,
                files: 4,
                due: "5 days",
            },
        ],
    },
    {
        name: "In Review",
        barClass: "bg-amber-500",
        tasks: [
            {
                ...MEDIUM,
                category: "Development",
                categoryClass: "bg-emerald-500/12 text-emerald-700",
                title: "Develop login/auth modal",
                subtasks: 8,
                files: 2,
                due: "3 days",
            },
            {
                ...MEDIUM,
                category: "Marketing",
                categoryClass: "bg-pink-500/12 text-pink-700",
                title: "Migrate email templates",
                subtasks: 3,
                files: 1,
                due: "1 day",
            },
        ],
    },
];

/** The same board, organised by the team's own column names. */
const CUSTOM_COLUMNS: BoardColumn[] = [
    {
        name: "Frontend",
        barClass: "bg-sky-500",
        tasks: [
            {
                ...MEDIUM,
                category: "Web",
                categoryClass: "bg-blue-500/12 text-blue-700",
                title: "Fix hydration warning on landing",
                subtasks: 5,
                files: 2,
                due: "2 days",
            },
            {
                ...LOW,
                category: "Design",
                categoryClass: "bg-purple-500/12 text-purple-700",
                title: "Polish empty states",
                subtasks: 3,
                files: 1,
                due: "4 days",
            },
        ],
    },
    {
        name: "DevOps",
        barClass: "bg-orange-500",
        tasks: [
            {
                ...MEDIUM,
                category: "CI",
                categoryClass: "bg-teal-500/12 text-teal-700",
                title: "Cache bun installs in CI",
                subtasks: 7,
                files: 2,
                due: "3 days",
            },
            {
                ...HIGH,
                category: "Infra",
                categoryClass: "bg-orange-500/12 text-orange-700",
                title: "Rotate runner images",
                subtasks: 9,
                files: 3,
                due: "2 days",
            },
        ],
    },
    {
        name: "Backend",
        barClass: "bg-emerald-500",
        tasks: [
            {
                ...MEDIUM,
                category: "Database",
                categoryClass: "bg-emerald-500/12 text-emerald-700",
                title: "Index issue-chat lookups",
                subtasks: 6,
                files: 2,
                due: "5 days",
            },
            {
                ...HIGH,
                category: "Auth",
                categoryClass: "bg-pink-500/12 text-pink-700",
                title: "Harden OTP rate limits",
                subtasks: 4,
                files: 1,
                due: "1 day",
            },
        ],
    },
];

function TaskCard({ task }: { task: Task }) {
    return (
        <div className="rounded-md border border-edge bg-graphite p-3 shadow-[0_1px_2px_rgba(24,24,27,0.06)] transition-transform duration-300 hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5">
                <span
                    className={cn(
                        "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px]",
                        task.priorityClass,
                    )}
                >
                    <span className={cn("size-1 rounded-full", task.dotClass)} />
                    {task.priority}
                </span>
                <span className={cn("rounded-sm px-1.5 py-0.5 text-[9px]", task.categoryClass)}>
                    {task.category}
                </span>
            </div>
            <p className="mt-2 truncate text-xs font-medium text-foreground">{task.title}</p>
            <div className="mt-2 flex items-center gap-2.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <ShowcaseSubtaskCountIcon className="size-2.5" />
                    {task.subtasks}
                </span>
                <span className="flex items-center gap-1">
                    <AttachmentCountIcon className="size-2.5" />
                    {task.files}
                </span>
                <span className="flex items-center gap-1">
                    <ShowcaseDueDateIcon className="size-2.5" />
                    {task.due}
                </span>
            </div>
        </div>
    );
}

export default memo(function BoardShowcase() {
    const [mode, setMode] = useState<BoardMode>("llm");
    const reduceMotion = useReducedMotion();
    const columns = mode === "llm" ? LLM_COLUMNS : CUSTOM_COLUMNS;

    return (
        <ShowcaseFrame
            image="/landing/feature1.jpg"
            glass={BOARD_GLASS}
            contentClassName="max-w-140"
        >
            <MockScene>
                <PanelCard
                    title="Create Tasks"
                    description="Quickly add tasks with details, deadlines, and assignees."
                >
                    <div className="flex items-center justify-between gap-3">
                        <motion.div
                            variants={appear(0.35)}
                            className="inline-flex items-center gap-0.5 rounded-sm border border-edge bg-foreground/3 p-0.5"
                        >
                            {BOARD_MODES.map((entry) => (
                                <button
                                    key={entry.value}
                                    type="button"
                                    onClick={() => setMode(entry.value)}
                                    className={cn(
                                        "cursor-pointer rounded-[3px] px-2.5 py-0.5 text-[10px] transition-colors duration-300",
                                        mode === entry.value
                                            ? "bg-graphite text-foreground shadow-[0_1px_2px_rgba(24,24,27,0.08)]"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {entry.label}
                                </button>
                            ))}
                        </motion.div>

                        <motion.div
                            variants={appear(0.45)}
                            className="inline-flex items-center gap-0.5 rounded-sm border border-edge bg-foreground/3 p-0.5"
                        >
                            {VIEW_TABS.map((tab) => (
                                <span
                                    key={tab.label}
                                    className={cn(
                                        "flex cursor-default items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[10px] transition-colors duration-300",
                                        tab.active
                                            ? "bg-graphite text-foreground shadow-[0_1px_2px_rgba(24,24,27,0.08)]"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    <tab.icon className="size-2.5" />
                                    {tab.label}
                                </span>
                            ))}
                        </motion.div>
                    </div>

                    <div className="mt-4 -mr-6 overflow-hidden md:-mr-7">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={mode}
                                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.45, ease: EASE_OUT }}
                                className="flex gap-3"
                            >
                                {columns.map((column) => (
                                    <div
                                        key={column.name}
                                        className="w-50 shrink-0 rounded-md border border-edge bg-charcoal p-2.5"
                                    >
                                        <div className="flex items-center justify-between px-0.5">
                                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/85">
                                                <span
                                                    className={cn(
                                                        "h-3 w-[2.5px] rounded-full",
                                                        column.barClass,
                                                    )}
                                                />
                                                {column.name}
                                            </span>
                                            <OverflowMenuIcon className="size-3 text-muted-foreground/70" />
                                        </div>
                                        <div className="mt-2.5 flex flex-col gap-2.5">
                                            {column.tasks.map((task) => (
                                                <TaskCard key={task.title} task={task} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </PanelCard>
            </MockScene>
        </ShowcaseFrame>
    );
});
