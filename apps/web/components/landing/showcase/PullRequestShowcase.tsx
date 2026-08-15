"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { LuAlarmClock, LuCornerDownRight, LuMessageSquare, LuPaperclip } from "react-icons/lu";
import { appear, EASE_OUT, MockScene, PanelCard } from "./MockWindow";
import ShowcaseFrame from "./ShowcaseFrame";

const BAR_COUNT = 12;

type ReviewTask = {
    title: string;
    description: string;
    comments: number;
    files: number;
    eta: string;
    done: number;
    doneBar: string;
    delay: number;
    dim?: boolean;
    owner?: boolean;
};

const TASKS: ReviewTask[] = [
    {
        title: "Currency conversion logic",
        description: "Fix rounding drift when invoices convert between currencies.",
        comments: 6,
        files: 6,
        eta: "2 days",
        done: 12,
        doneBar: "bg-emerald-400",
        delay: 0.35,
        owner: true,
    },
    {
        title: "Project kickoff meeting",
        description: "Align scope, owners, and the delivery timeline for the sprint.",
        comments: 3,
        files: 2,
        eta: "5 days",
        done: 4,
        doneBar: "bg-amber-400",
        delay: 0.6,
        dim: true,
    },
];

/** Each progress segment springs up in sequence once the card has settled. */
function rise(delay: number) {
    return {
        hidden: { opacity: 0, scaleY: 0.3 },
        visible: {
            opacity: 1,
            scaleY: 1,
            transition: { delay, duration: 0.35, ease: EASE_OUT },
        },
    };
}

function TaskCard({ task }: { task: ReviewTask }) {
    return (
        <motion.div
            variants={appear(task.delay)}
            className={
                task.dim
                    ? "mt-3 rounded-md border border-white/6 bg-charcoal p-4 opacity-70"
                    : "rounded-md border border-white/6 bg-charcoal p-4"
            }
        >
            <p className="text-[13px] font-semibold text-neutral-100">{task.title}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
                {task.description}
            </p>
            <div className="mt-3 flex items-center gap-3.5 text-[11px] text-neutral-500">
                <LuCornerDownRight className="size-3.5" />
                <span className="flex items-center gap-1">
                    <LuMessageSquare className="size-3" /> {task.comments}
                </span>
                <span className="flex items-center gap-1">
                    <LuPaperclip className="size-3" /> {task.files}
                </span>
                <span className="flex items-center gap-1">
                    <LuAlarmClock className="size-3" /> {task.eta}
                </span>
            </div>
            <div className="mt-3.5 flex items-center gap-2.5 border-t border-white/4 pt-3">
                <span className="flex items-center gap-[2.5px]">
                    {Array.from({ length: BAR_COUNT }, (_, i) => (
                        <motion.span
                            key={i}
                            variants={rise(task.delay + 0.2 + i * 0.04)}
                            className={
                                i < task.done
                                    ? `h-3 w-0.75 origin-bottom rounded-full ${task.doneBar}`
                                    : "h-3 w-0.75 origin-bottom rounded-full bg-white/15"
                            }
                        />
                    ))}
                </span>
                <span className="text-[10px] text-neutral-500">
                    <span className="text-[11px] font-semibold text-neutral-100">{task.done}</span>{" "}
                    / {BAR_COUNT}
                </span>
                {task.owner && (
                    <Image
                        src="/images/user.png"
                        alt=""
                        width={20}
                        height={20}
                        className="ml-auto size-6 rounded-sm border border-white/15 object-cover select-none"
                    />
                )}
            </div>
        </motion.div>
    );
}

export default function PullRequestShowcase() {
    return (
        <ShowcaseFrame
            image="/landing/feature3.jpg"
            glass={{ angle: 0, size: 0.3 }}
            contentClassName="max-w-140"
        >
            <MockScene>
                <PanelCard
                    title="Review & Complete"
                    description="Approve work, close tasks, and celebrate on-time delivery."
                >
                    {TASKS.map((task) => (
                        <TaskCard key={task.title} task={task} />
                    ))}
                </PanelCard>
            </MockScene>
        </ShowcaseFrame>
    );
}
