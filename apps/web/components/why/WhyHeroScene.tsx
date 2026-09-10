"use client";

import {
    AutonomousModeIcon,
    BreadcrumbSeparatorIcon,
    ChangedFilesIcon,
    CheckIcon,
    ClockIcon,
    GitBranchIcon,
    HighPriorityIcon,
    LoadingSpinnerIcon,
    OverflowMenuIcon,
    PullRequestOpenIcon,
    RunnerIcon,
    TagIcon,
} from "@trydarwin/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import { KanbanStatus } from "@/types/kanban";

const EASE = [0.22, 1, 0.36, 1] as const;

const FIRST_ENTER_MS = 2300;
const STEPS = [
    { name: "enter", ms: 900 },
    { name: "expand", ms: 700 },
    { name: "rows", ms: 900 },
    { name: "resolve", ms: 700 },
    { name: "resolve", ms: 800 },
    { name: "resolve", ms: 1000 },
    { name: "resolve", ms: 1200 },
    { name: "settle", ms: 900 },
    { name: "pull-request", ms: 900 },
    { name: "comment", ms: 1100 },
    { name: "done", ms: 0 },
] as const;
const FIRST_RESOLVE = STEPS.findIndex((s) => s.name === "resolve");
const SETTLE = STEPS.findIndex((s) => s.name === "settle");
const PULL_REQUEST = STEPS.findIndex((s) => s.name === "pull-request");
const COMMENT = STEPS.findIndex((s) => s.name === "comment");
const DONE = STEPS.length - 1;
const PANEL_HEADER_PX = 32;
const PANEL_COLLAPSED_PX = 36;
const PANEL_EXPANDED_PX = 148;
const PANEL_LIFTED = { x: 24, y: -28, boxShadow: "0 30px 60px -20px rgba(24, 24, 27, 0.35)" };
const PANEL_SETTLED = { x: 0, y: 0, boxShadow: "0 1px 3px -1px rgba(24, 24, 27, 0.12)" };

const AGENT = "agent-3";

type ChipSpec = { text: string; Icon?: typeof CheckIcon; iconClassName?: string; actor?: string };

const ROWS: { label: string; pending: string; done: ChipSpec[] }[] = [
    {
        label: "Claimed by",
        pending: "Finding an agent…",
        done: [
            { text: AGENT, actor: AGENT },
            { text: "runner-3", Icon: RunnerIcon },
        ],
    },
    {
        label: "Plan",
        pending: "Reading the repo…",
        done: [
            { text: "3 steps", Icon: CheckIcon, iconClassName: "text-green-500" },
            { text: "service.otp.ts", Icon: ChangedFilesIcon },
            { text: "+2 files" },
        ],
    },
    {
        label: "Runner",
        pending: "Running tests…",
        done: [
            { text: "42/42 passed", Icon: CheckIcon, iconClassName: "text-green-500" },
            { text: "typecheck ok", Icon: CheckIcon, iconClassName: "text-green-500" },
        ],
    },
    {
        label: "Pull request",
        pending: "Opening PR…",
        done: [
            {
                text: "#482 Fix OTP deliverability for Gmail",
                Icon: PullRequestOpenIcon,
                iconClassName: "text-green-500",
            },
            { text: "dar-142", Icon: GitBranchIcon },
        ],
    },
];

const IN_PROGRESS = KanbanBoard.columnFor(KanbanStatus.InProgress);
const IN_REVIEW = KanbanBoard.columnFor(KanbanStatus.InReview);

function usePanelStep(reduce: boolean) {
    const [step, setStep] = useState(reduce ? DONE : -1);

    useEffect(() => {
        if (reduce || step >= DONE) return;
        const ms = step < 0 ? FIRST_ENTER_MS : STEPS[step].ms;
        const id = setTimeout(() => setStep((s) => s + 1), ms);
        return () => clearTimeout(id);
    }, [step, reduce]);

    return step;
}

function Avatar({ initials, className }: { initials: string; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[8px] font-semibold text-primary",
                className,
            )}
        >
            {initials}
        </span>
    );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-[4px] bg-foreground/4 px-1.5 py-0.5 text-[12px] leading-5 text-foreground/80 ring-1 ring-foreground/6",
                className,
            )}
        >
            {children}
        </span>
    );
}

function Actor({ who, className }: { who: string; className?: string }) {
    if (who === AGENT) return <HeroBuddy move={false} className={cn("size-4", className)} />;
    return <Avatar initials={who} className={className} />;
}

function DoneChip({ chip }: { chip: ChipSpec }) {
    const Icon = chip.Icon;
    return (
        <Chip>
            {chip.actor && <Actor who={chip.actor} className="-ml-0.5 size-3.5" />}
            {Icon && <Icon className={cn("size-3 text-foreground/45", chip.iconClassName)} />}
            {chip.text}
        </Chip>
    );
}

function Row({
    row,
    index,
    resolved,
}: {
    row: (typeof ROWS)[number];
    index: number;
    resolved: boolean;
}) {
    return (
        <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12, duration: 0.45, ease: EASE }}
        >
            <span className="w-22 shrink-0 text-[12px] text-foreground/45">{row.label}</span>
            <AnimatePresence mode="wait" initial={false}>
                {resolved ? (
                    <motion.span
                        key="done"
                        className="flex items-center gap-1.5"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                    >
                        {row.done.map((chip) => (
                            <DoneChip key={chip.text} chip={chip} />
                        ))}
                    </motion.span>
                ) : (
                    <motion.span
                        key="pending"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Chip className="text-foreground/45">
                            <LoadingSpinnerIcon className="size-3 animate-spin text-foreground/35" />
                            {row.pending}
                        </Chip>
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function AgentPanel({ step, reduce }: { step: number; reduce: boolean }) {
    const expanded = step >= 1;
    const settled = step >= SETTLE;
    const resolvedCount = Math.max(0, step - FIRST_RESOLVE + 1);

    return (
        <motion.div
            className="absolute top-[9rem] left-[3%] w-[58%] overflow-hidden rounded-lg bg-card ring-1 ring-border"
            initial={reduce ? false : { opacity: 0, ...PANEL_LIFTED, y: -56, filter: "blur(8px)" }}
            animate={
                settled
                    ? { opacity: 1, ...PANEL_SETTLED, filter: "blur(0px)" }
                    : { opacity: 1, ...PANEL_LIFTED, filter: "blur(0px)" }
            }
            transition={{ duration: settled ? 0.7 : 0.8, ease: EASE }}
        >
            <div className="flex items-center justify-between px-4 pt-3">
                <div className="flex items-center gap-2 text-[14px] font-medium text-foreground/90">
                    <HeroBuddy move={false} className="size-4" />
                    Darwin Agent
                </div>
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            className="flex items-center gap-1.5"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: EASE }}
                        >
                            <Chip className="text-[11px] leading-4 text-foreground/60">
                                <AutonomousModeIcon className="size-3 text-primary" />
                                Autonomous
                            </Chip>
                            <Chip className="text-[11px] leading-4 text-foreground/60">
                                <ClockIcon className="size-3" />
                                2m 14s
                            </Chip>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <motion.div
                className="overflow-hidden"
                initial={false}
                animate={{ height: expanded ? PANEL_EXPANDED_PX : PANEL_COLLAPSED_PX }}
                transition={{ duration: 0.55, ease: EASE }}
            >
                {expanded ? (
                    <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
                        {ROWS.map((row, i) => (
                            <Row key={row.label} row={row} index={i} resolved={i < resolvedCount} />
                        ))}
                    </div>
                ) : (
                    <p className="px-4 pt-2 pb-2.5 font-mono text-[12px] text-foreground/45">
                        Looking at the issue…
                    </p>
                )}
            </motion.div>
        </motion.div>
    );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-4 text-[13px]">
            <span className="w-20 shrink-0 text-foreground/40">{label}</span>
            <span className="inline-flex items-center gap-1.5 text-foreground/75">{children}</span>
        </div>
    );
}

const REVEAL_UP = {
    hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

function PullRequestCard() {
    return (
        <div className="flex max-w-2xl items-center gap-3 rounded-lg bg-card px-4 py-3 ring-1 ring-border">
            <PullRequestOpenIcon className="size-4 shrink-0 text-green-500" />
            <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground">
                #482 Fix OTP deliverability for Gmail
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-green-500">
                <CheckIcon className="size-3" />
                42 checks
            </span>
            <Chip className="shrink-0 text-[11px] leading-4 text-foreground/60">
                Review requested
            </Chip>
        </div>
    );
}

function AgentComment() {
    return (
        <div className="flex max-w-2xl items-center gap-2.5 text-[13px] text-foreground/50">
            <Actor who={AGENT} className="size-4" />
            <span className="truncate">
                <span className="text-foreground/75">{AGENT}</span> · Unverified sender failed DKIM.
                Switched to the verified domain.
            </span>
        </div>
    );
}

export default function WhyHeroScene() {
    const reduce = useReducedMotion() ?? false;
    const step = usePanelStep(reduce);
    const status = step >= DONE ? IN_REVIEW : IN_PROGRESS;
    const statusLabel = step >= DONE ? "In review" : "In progress";

    return (
        <div className="relative w-full rounded-lg bg-surface shadow-2xl shadow-foreground/10 ring-1 ring-border">
            <div className="flex items-center justify-between border-b border-border-subtle px-8 py-3 text-[13px] text-foreground/40">
                <div className="flex items-center gap-2 text-foreground/70">
                    <HeroBuddy move={false} className="size-4" />
                    Engineering
                    <BreadcrumbSeparatorIcon className="size-3 text-foreground/30" />
                    Board
                    <BreadcrumbSeparatorIcon className="size-3 text-foreground/30" />
                    <span className="font-mono text-foreground/50">DAR-142</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="rounded-[4px] bg-foreground/4 px-2.5 py-1 ring-1 ring-foreground/6">
                        Subscribe
                    </span>
                    <span className="flex -space-x-1.5">
                        <Avatar initials="PR" className="size-5 text-[9px] ring-2 ring-card" />
                        <Avatar initials="KT" className="size-5 text-[9px] ring-2 ring-card" />
                        <Actor who={AGENT} className="size-5" />
                    </span>
                    <OverflowMenuIcon className="size-4" />
                </div>
            </div>

            <div className="grid grid-cols-[1fr_16rem] gap-16 px-12 pt-7 pb-80">
                <div>
                    <h3 className="text-[2rem] leading-tight font-medium tracking-tight text-foreground">
                        OTP emails land in spam for Gmail users
                    </h3>
                    <p className="mt-54 max-w-3xl text-[1.1rem] leading-relaxed text-foreground/65">
                        The one-time code lands in spam for most Gmail accounts, so users abandon
                        sign-up.
                    </p>

                    {step >= PULL_REQUEST && (
                        <motion.div
                            className="mt-8"
                            variants={REVEAL_UP}
                            initial={reduce ? false : "hidden"}
                            animate="show"
                            transition={{ duration: 0.7, ease: EASE }}
                        >
                            <PullRequestCard />
                        </motion.div>
                    )}
                    {step >= COMMENT && (
                        <motion.div
                            className="mt-4 pl-1"
                            variants={REVEAL_UP}
                            initial={reduce ? false : "hidden"}
                            animate="show"
                            transition={{ duration: 0.7, ease: EASE }}
                        >
                            <AgentComment />
                        </motion.div>
                    )}
                </div>

                <div className="flex flex-col gap-4 pt-3">
                    {status && (
                        <Property label="Status">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                    key={statusLabel}
                                    className="inline-flex items-center gap-1.5"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <status.icon className={cn("size-3.5", status.titleBox)} />
                                    {statusLabel}
                                </motion.span>
                            </AnimatePresence>
                        </Property>
                    )}
                    <Property label="Priority">
                        <HighPriorityIcon className="size-3.5" />
                        High
                    </Property>
                    <Property label="Assignee">
                        <Actor who={AGENT} />
                        {AGENT}
                    </Property>
                    <Property label="Labels">
                        <TagIcon className="size-3.5 text-foreground/40" />
                        auth, email
                    </Property>
                    <Property label="Project">Web platform</Property>
                    <Property label="Runner">
                        <RunnerIcon className="size-3.5 text-foreground/40" />
                        runner-3
                    </Property>
                </div>
            </div>

            <div
                className="absolute top-[9rem] left-[3%] w-[58%] rounded-lg bg-foreground/4 shadow-inner shadow-foreground/10 ring-1 ring-foreground/5"
                style={{ height: PANEL_HEADER_PX + PANEL_EXPANDED_PX }}
            />
            {step >= 0 && <AgentPanel step={step} reduce={reduce} />}
        </div>
    );
}
