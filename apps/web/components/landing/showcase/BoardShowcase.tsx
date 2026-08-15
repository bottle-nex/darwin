"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
    BsArrowReturnRight,
    BsBarChartSteps,
    BsClock,
    BsFiles,
    BsKanban,
    BsListUl,
    BsThreeDots,
} from "react-icons/bs";
import { cn } from "@/lib/utils";
import { appear, EASE_OUT, MockScene, PanelCard } from "./MockWindow";
import ShowcaseFrame from "./ShowcaseFrame";

type BoardMode = "custom" | "llm";

const BOARD_MODES: { value: BoardMode; label: string }[] = [
    { value: "llm", label: "LLM" },
    { value: "custom", label: "Custom" },
];

const VIEW_TABS: { label: string; icon: IconType; active?: boolean }[] = [
    { label: "Kanban", icon: BsKanban, active: true },
    { label: "List", icon: BsListUl },
    { label: "Timeline", icon: BsBarChartSteps },
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
    priorityClass: "bg-amber-400/10 text-amber-300",
    dotClass: "bg-amber-400",
};
const HIGH = {
    priority: "High",
    priorityClass: "bg-rose-400/10 text-rose-300",
    dotClass: "bg-rose-400",
};
const LOW = {
    priority: "Low",
    priorityClass: "bg-sky-400/10 text-sky-300",
    dotClass: "bg-sky-400",
};

/** The board the agents run: statuses managed by the LLM pipeline. */
const LLM_COLUMNS: BoardColumn[] = [
    {
        name: "To Do",
        barClass: "bg-sky-300/80",
        tasks: [
            {
                ...MEDIUM,
                category: "Research",
                categoryClass: "bg-teal-400/10 text-teal-300",
                title: "Define KPI list for Q2",
                subtasks: 18,
                files: 3,
                due: "4 days",
            },
            {
                ...LOW,
                category: "Design",
                categoryClass: "bg-purple-400/10 text-purple-300",
                title: "Refine onboarding checklist",
                subtasks: 4,
                files: 1,
                due: "6 days",
            },
        ],
    },
    {
        name: "In Progress",
        barClass: "bg-blue-400/80",
        tasks: [
            {
                ...MEDIUM,
                category: "Saas",
                categoryClass: "bg-blue-400/10 text-blue-300",
                title: "Create wireframes",
                subtasks: 6,
                files: 6,
                due: "2 days",
            },
            {
                ...HIGH,
                category: "Backend",
                categoryClass: "bg-emerald-400/10 text-emerald-300",
                title: "API error dashboard",
                subtasks: 12,
                files: 4,
                due: "5 days",
            },
        ],
    },
    {
        name: "In Review",
        barClass: "bg-amber-400/80",
        tasks: [
            {
                ...MEDIUM,
                category: "Development",
                categoryClass: "bg-emerald-400/10 text-emerald-300",
                title: "Develop login/auth modal",
                subtasks: 8,
                files: 2,
                due: "3 days",
            },
            {
                ...MEDIUM,
                category: "Marketing",
                categoryClass: "bg-pink-400/10 text-pink-300",
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
        barClass: "bg-sky-300/80",
        tasks: [
            {
                ...MEDIUM,
                category: "Web",
                categoryClass: "bg-blue-400/10 text-blue-300",
                title: "Fix hydration warning on landing",
                subtasks: 5,
                files: 2,
                due: "2 days",
            },
            {
                ...LOW,
                category: "Design",
                categoryClass: "bg-purple-400/10 text-purple-300",
                title: "Polish empty states",
                subtasks: 3,
                files: 1,
                due: "4 days",
            },
        ],
    },
    {
        name: "DevOps",
        barClass: "bg-orange-400/80",
        tasks: [
            {
                ...MEDIUM,
                category: "CI",
                categoryClass: "bg-teal-400/10 text-teal-300",
                title: "Cache bun installs in CI",
                subtasks: 7,
                files: 2,
                due: "3 days",
            },
            {
                ...HIGH,
                category: "Infra",
                categoryClass: "bg-orange-400/10 text-orange-300",
                title: "Rotate runner images",
                subtasks: 9,
                files: 3,
                due: "2 days",
            },
        ],
    },
    {
        name: "Backend",
        barClass: "bg-emerald-400/80",
        tasks: [
            {
                ...MEDIUM,
                category: "Database",
                categoryClass: "bg-emerald-400/10 text-emerald-300",
                title: "Index issue-chat lookups",
                subtasks: 6,
                files: 2,
                due: "5 days",
            },
            {
                ...HIGH,
                category: "Auth",
                categoryClass: "bg-pink-400/10 text-pink-300",
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
        <div className="rounded-md border border-white/5 bg-graphite p-3 transition-transform duration-300 hover:-translate-y-0.5">
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
            <p className="mt-2 truncate text-xs font-medium text-neutral-100">{task.title}</p>
            <div className="mt-2 flex items-center gap-2.5 text-[10px] text-neutral-500">
                <span className="flex items-center gap-1">
                    <BsArrowReturnRight className="size-2.5" />
                    {task.subtasks}
                </span>
                <span className="flex items-center gap-1">
                    <BsFiles className="size-2.5" />
                    {task.files}
                </span>
                <span className="flex items-center gap-1">
                    <BsClock className="size-2.5" />
                    {task.due}
                </span>
            </div>
        </div>
    );
}

export default function BoardShowcase() {
    const [mode, setMode] = useState<BoardMode>("llm");
    const reduceMotion = useReducedMotion();
    const columns = mode === "llm" ? LLM_COLUMNS : CUSTOM_COLUMNS;

    return (
        <ShowcaseFrame
            image="/landing/feature1.jpg"
            glass={{ angle: 0, size: 0.5 }}
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
                            className="inline-flex items-center gap-0.5 rounded-sm border border-white/10 bg-white/2 p-0.5"
                        >
                            {BOARD_MODES.map((entry) => (
                                <button
                                    key={entry.value}
                                    type="button"
                                    onClick={() => setMode(entry.value)}
                                    className={cn(
                                        "cursor-pointer rounded-[3px] px-2.5 py-0.5 text-[10px] transition-colors duration-300",
                                        mode === entry.value
                                            ? "bg-white/10 text-neutral-100"
                                            : "text-neutral-500 hover:text-neutral-300",
                                    )}
                                >
                                    {entry.label}
                                </button>
                            ))}
                        </motion.div>

                        <motion.div
                            variants={appear(0.45)}
                            className="inline-flex items-center gap-0.5 rounded-sm border border-white/10 bg-white/2 p-0.5"
                        >
                            {VIEW_TABS.map((tab) => (
                                <span
                                    key={tab.label}
                                    className={cn(
                                        "flex cursor-default items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[10px] transition-colors duration-300",
                                        tab.active
                                            ? "bg-white/10 text-neutral-100"
                                            : "text-neutral-500 hover:text-neutral-300",
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
                                        className="w-50 shrink-0 rounded-md border border-white/5 bg-charcoal p-2.5"
                                    >
                                        <div className="flex items-center justify-between px-0.5">
                                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-200">
                                                <span
                                                    className={cn(
                                                        "h-3 w-[2.5px] rounded-full",
                                                        column.barClass,
                                                    )}
                                                />
                                                {column.name}
                                            </span>
                                            <BsThreeDots className="size-3 text-neutral-600" />
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
}
