"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
    appear,
    EASE_OUT,
    MockScene,
    PanelCard,
    PRIORITY_STYLES,
    PriorityPill,
    TAG_STYLES,
    TagPill,
} from "./MockWindow";
import ShowcaseFrame from "./ShowcaseFrame";

type Task = {
    name: string;
    done: number;
    total: number;
    /** Progress-bar fill, 0–100, with its fill colour class. */
    pct: number;
    bar: string;
    tag: string;
    tagStyle: string;
    priority: string;
    priorityStyle: string;
    due: string;
    delay: number;
};

const TASKS: Task[] = [
    {
        name: "Define KPI list for Q2",
        done: 14,
        total: 20,
        pct: 70,
        bar: "bg-[#6b8afd]",
        tag: "Research",
        tagStyle: TAG_STYLES.research,
        priority: "Medium",
        priorityStyle: PRIORITY_STYLES.medium,
        due: "12 Mar 2024",
        delay: 0.45,
    },
    {
        name: "Set up database schema",
        done: 6,
        total: 12,
        pct: 50,
        bar: "bg-[#d9a13c]",
        tag: "Research",
        tagStyle: TAG_STYLES.research,
        priority: "High",
        priorityStyle: PRIORITY_STYLES.high,
        due: "16 Mar 2024",
        delay: 0.6,
    },
    {
        name: "Confirm finance data sources",
        done: 0,
        total: 9,
        pct: 0,
        bar: "bg-neutral-500",
        tag: "Meeting",
        tagStyle: TAG_STYLES.meeting,
        priority: "Low",
        priorityStyle: PRIORITY_STYLES.low,
        due: "18 Mar 2024",
        delay: 0.75,
    },
];

const ROW_GRID =
    "grid grid-cols-[26px_minmax(0,2.4fr)_minmax(0,0.95fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] items-center gap-x-2.5 px-3";

function grow(pct: number, delay: number) {
    return {
        hidden: { width: "0%" },
        visible: { width: `${pct}%`, transition: { delay, duration: 0.8, ease: EASE_OUT } },
    };
}

function Checkbox() {
    return <span className="size-3.5 rounded-[4px] border border-white/12 bg-white/4" />;
}

function SectionLabel({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="h-3 w-0.5 rounded-full bg-neutral-400" />
            <span className="text-[11px] font-medium text-neutral-300">{label}</span>
        </div>
    );
}

function TaskRow({ task }: { task: Task }) {
    return (
        <motion.div
            variants={appear(task.delay)}
            className={cn(ROW_GRID, "border-b border-white/4 py-2.5 last:border-0")}
        >
            <Checkbox />
            <span className="truncate text-[11px] font-medium whitespace-nowrap text-neutral-100 md:text-xs">
                {task.name}
            </span>
            <span className="flex items-center gap-2">
                <span className="h-1 w-10 overflow-hidden rounded-full bg-white/10">
                    <motion.span
                        variants={grow(task.pct, task.delay + 0.2)}
                        className={cn("block h-full rounded-full", task.bar)}
                    />
                </span>
                <span className="text-[10px] whitespace-nowrap text-neutral-500">
                    <span className="text-[11px] font-semibold text-neutral-100">{task.done}</span>{" "}
                    / {task.total}
                </span>
            </span>
            <span>
                <TagPill label={task.tag} className={task.tagStyle} />
            </span>
            <span>
                <PriorityPill label={task.priority} className={task.priorityStyle} />
            </span>
            <span className="text-[11px] whitespace-nowrap text-neutral-300">{task.due}</span>
        </motion.div>
    );
}

export default function AgentShowcase() {
    return (
        <ShowcaseFrame
            image="/landing/feature2.jpg"
            glass={{ angle: 0, size: 0.3 }}
            contentClassName="max-w-140"
        >
            <MockScene>
                <PanelCard
                    title="Assign Work"
                    description="Delegate with clarity and keep ownership visible at all times."
                >
                    <motion.div
                        variants={appear(0.35)}
                        className="-mr-20 overflow-hidden rounded-md border border-white/6 bg-[#101012]"
                    >
                        <div className="border-b border-white/6 px-3 py-2.5">
                            <SectionLabel label="To Do" />
                        </div>
                        <div
                            className={cn(
                                ROW_GRID,
                                "border-b border-white/5 py-2 text-[10px] text-neutral-600",
                            )}
                        >
                            <Checkbox />
                            <span>Task Name</span>
                            <span>Progress</span>
                            <span>Type Task</span>
                            <span>Priority</span>
                            <span>Due Date</span>
                        </div>
                        {TASKS.map((task) => (
                            <TaskRow key={task.name} task={task} />
                        ))}
                    </motion.div>

                    <motion.div
                        variants={appear(0.9)}
                        className="mt-auto -mr-20 rounded-md border border-white/5 bg-[#101012] px-3 py-2.5 opacity-45"
                    >
                        <SectionLabel label="In Progress" />
                    </motion.div>
                </PanelCard>
            </MockScene>
        </ShowcaseFrame>
    );
}
