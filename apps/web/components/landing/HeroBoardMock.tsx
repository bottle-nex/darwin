"use client";

import {
    AddIcon,
    CheckIcon,
    FilterIcon,
    PlatformAgentsIcon,
    PlatformBoardIcon,
    PlatformInboxIcon,
    PlatformInsightsIcon,
    PlatformRunnersIcon,
    PlatformSettingsIcon,
    PullRequestOpenIcon,
    SearchIcon,
    SwitcherToggleIcon,
} from "@trymatcha/ui/icons";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { AppLogo } from "@/components/logo/AppLogo";
import { cn } from "@/lib/utils";

/**
 * App-shell mock of the matcha dashboard: sidebar, top bar and a kanban board.
 * One featured issue travels across the columns on a loop — claimed by an
 * agent, worked, reviewed, merged — while a log line ticks in the top bar.
 */

const STAGE_MS = 2600;
const STAGE_COUNT = 4;

type MockCard = { id: string; title: string; tag: string; assignee: string };

const COLUMNS: { title: string; cards: MockCard[] }[] = [
    {
        title: "Backlog",
        cards: [
            { id: "MAT-128", title: "Rate-limit OTP requests", tag: "auth", assignee: "PR" },
            { id: "MAT-131", title: "Debounce board autosave", tag: "board", assignee: "KT" },
        ],
    },
    {
        title: "In progress",
        cards: [{ id: "MAT-119", title: "Migrate billing webhooks", tag: "api", assignee: "A2" }],
    },
    {
        title: "In review",
        cards: [{ id: "MAT-107", title: "Dark mode design tokens", tag: "web", assignee: "SJ" }],
    },
    {
        title: "Done",
        cards: [
            { id: "MAT-98", title: "Board drag physics", tag: "board", assignee: "A1" },
            { id: "MAT-95", title: "Runner image cache", tag: "infra", assignee: "A3" },
        ],
    },
];

const LOGS = [
    "agent-3 claimed MAT-142",
    "cloned navlabs/apollo · branch mat-142",
    "implementing fix · 4 files changed",
    "tests passed · 42/42",
    "PR #482 opened · awaiting review",
];

const NAV = [
    { label: "Board", icon: PlatformBoardIcon, active: true },
    { label: "Inbox", icon: PlatformInboxIcon },
    { label: "Agents", icon: PlatformAgentsIcon },
    { label: "Runners", icon: PlatformRunnersIcon },
    { label: "Insights", icon: PlatformInsightsIcon },
    { label: "Settings", icon: PlatformSettingsIcon },
];

function Avatar({ initials, className }: { initials: string; className?: string }) {
    return (
        <span
            className={cn(
                "flex size-4.5 items-center justify-center rounded-full bg-[#26262b] text-[8px] font-medium text-neutral-300 ring-1 ring-white/10",
                className,
            )}
        >
            {initials}
        </span>
    );
}

function StaticCard({ card }: { card: MockCard }) {
    return (
        <div className="rounded-lg border border-white/7 bg-cement p-2.5">
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-neutral-500">{card.id}</span>
                <Avatar initials={card.assignee} />
            </div>
            <p className="mt-1 text-xs leading-snug text-neutral-300">{card.title}</p>
            <span className="mt-2 inline-block rounded border border-white/8 px-1.5 py-px font-mono text-[9px] text-neutral-500">
                {card.tag}
            </span>
        </div>
    );
}

/** The travelling issue — its footer changes with the stage it has reached. */
function ActiveCard({ stage, animate }: { stage: number; animate: boolean }) {
    return (
        <motion.div
            layoutId="mock-active-card"
            layout
            transition={animate ? { type: "spring", stiffness: 240, damping: 26 } : { duration: 0 }}
            className="rounded-lg border border-white/7 bg-graphite p-2.5"
        >
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-neutral-400">MAT-142</span>
                {stage === 3 ? (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-400/90">
                        <CheckIcon className="size-2.5" /> merged
                    </span>
                ) : (
                    <Avatar initials="A3" />
                )}
            </div>
            <p className="mt-1 text-xs leading-snug text-snow/90">
                Chat socket drops queued messages
            </p>
            <div className="mt-2 flex items-center gap-1.5">
                {stage === 0 && (
                    <span className="rounded border border-white/8 px-1.5 py-px font-mono text-[9px] text-neutral-500">
                        queued
                    </span>
                )}
                {stage === 1 && (
                    <>
                        <span className="font-mono text-[9px] text-neutral-400">agent-3</span>
                        <div className="ml-1 h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                            <motion.div
                                key="progress"
                                className="h-full rounded-full bg-neutral-400"
                                initial={{ width: "6%" }}
                                animate={{ width: animate ? "88%" : "50%" }}
                                transition={{ duration: STAGE_MS / 1000 - 0.4, ease: "easeInOut" }}
                            />
                        </div>
                    </>
                )}
                {stage === 2 && (
                    <>
                        <span className="flex items-center gap-1 rounded border border-white/10 bg-white/4 px-1.5 py-px font-mono text-[9px] text-neutral-300">
                            <PullRequestOpenIcon className="size-2.5" /> #482
                        </span>
                        <span className="font-mono text-[9px] text-neutral-500">checks 42/42</span>
                    </>
                )}
                {stage === 3 && (
                    <span className="font-mono text-[9px] text-neutral-500">
                        review → main · 2m
                    </span>
                )}
            </div>
        </motion.div>
    );
}

export default function HeroBoardMock({ className }: { className?: string }) {
    const reduceMotion = useReducedMotion();
    const [tick, setTick] = useState(0);
    const boardRef = useRef<HTMLDivElement>(null);
    const inView = useInView(boardRef, { amount: 0.2 });

    useEffect(() => {
        if (reduceMotion || !inView) return;
        const id = setInterval(() => setTick((t) => t + 1), STAGE_MS);
        return () => clearInterval(id);
    }, [reduceMotion, inView]);

    const stage = reduceMotion ? 1 : tick % STAGE_COUNT;
    const log = LOGS[tick % LOGS.length];

    return (
        <motion.div
            ref={boardRef}
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "flex overflow-hidden rounded-xl border border-white/10 bg-charcoal font-grotesk shadow-2xl shadow-black/70",
                className,
            )}
        >
            {/* Sidebar */}
            <aside className="hidden w-44 shrink-0 flex-col border-r border-white/6 bg-charcoal p-3 lg:flex">
                <div className="flex items-center gap-2 px-1.5">
                    <AppLogo className="h-3 w-auto text-snow" />
                    <span className="text-sm font-semibold tracking-tight text-snow">matcha</span>
                </div>

                <button className="mt-4 flex items-center justify-between rounded-md border border-white/8 bg-white/[0.03] px-2 py-1.5">
                    <span className="flex items-center gap-1.5">
                        <span className="flex size-4 items-center justify-center rounded bg-[#26262b] text-[8px] font-semibold text-neutral-300">
                            A
                        </span>
                        <span className="text-[11px] font-medium text-neutral-300">apollo</span>
                    </span>
                    <SwitcherToggleIcon className="size-3 text-neutral-600" />
                </button>

                <nav className="mt-4 flex flex-col gap-0.5">
                    {NAV.map(({ label, icon: Icon, active }) => (
                        <span
                            key={label}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium",
                                active
                                    ? "bg-white/6 text-snow"
                                    : "text-neutral-500 hover:text-neutral-300",
                            )}
                        >
                            <Icon className="size-3.5" />
                            {label}
                            {label === "Agents" && (
                                <span className="ml-auto rounded-full bg-white/6 px-1.5 font-mono text-[9px] text-neutral-400">
                                    3
                                </span>
                            )}
                        </span>
                    ))}
                </nav>

                {/* Agent status panel with the buddy. */}
                <div className="mt-auto rounded-lg border border-white/8 bg-charcoal p-2.5">
                    <div className="flex items-center gap-2">
                        <HeroBuddy className="size-6 -my-1" move={false} />
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-neutral-200">agent-3</p>
                            <p className="truncate font-mono text-[9px] text-neutral-500">
                                working on MAT-142
                            </p>
                        </div>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={log}
                            initial={reduceMotion ? false : { y: 6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={reduceMotion ? undefined : { y: -6, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-2 truncate border-t border-white/6 pt-2 font-mono text-[9px] text-neutral-500"
                        >
                            {log}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </aside>

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Top bar */}
                <div className="flex items-center gap-3 border-b border-white/6 px-4 py-2.5">
                    <span className="text-xs text-neutral-500">
                        apollo <span className="text-neutral-700">/</span>{" "}
                        <span className="font-medium text-neutral-200">Board</span>
                    </span>
                    <div className="ml-2 hidden flex-1 items-center gap-2 rounded-md border border-white/7 bg-white/[0.03] px-2.5 py-1.5 md:flex md:max-w-56">
                        <SearchIcon className="size-3 text-neutral-600" />
                        <span className="text-[11px] text-neutral-600">Search issues…</span>
                        <span className="ml-auto rounded border border-white/8 px-1 font-mono text-[9px] text-neutral-600">
                            ⌘K
                        </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2.5">
                        <span className="flex items-center gap-1.5 rounded-full border border-white/8 px-2 py-0.5">
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                            <span className="font-mono text-[9px] text-neutral-400">
                                3 agents online
                            </span>
                        </span>
                        <div className="flex -space-x-1.5">
                            <Avatar initials="PR" />
                            <Avatar initials="KT" />
                            <Avatar initials="SJ" />
                        </div>
                        <span className="flex items-center gap-1 rounded-md bg-snow px-2.5 py-1.5 text-[11px] font-medium text-ink">
                            <AddIcon className="size-3" /> New issue
                        </span>
                    </div>
                </div>

                {/* Filter row */}
                <div className="flex items-center gap-2 border-b border-white/6 px-4 py-2">
                    <span className="rounded-md bg-white/6 px-2 py-1 text-[10px] font-medium text-neutral-200">
                        All issues
                    </span>
                    <span className="px-2 py-1 text-[10px] text-neutral-500">Mine</span>
                    <span className="px-2 py-1 text-[10px] text-neutral-500">Agents</span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-neutral-500">
                        <FilterIcon className="size-3" /> Filter
                    </span>
                </div>

                {/* Kanban columns */}
                <div className="grid min-h-0 flex-1 grid-cols-4 gap-3 p-3.5">
                    {COLUMNS.map((column, i) => (
                        <div key={column.title} className="flex min-h-0 flex-col gap-2">
                            <div className="flex items-center justify-between px-0.5">
                                <span className="text-[11px] font-medium text-neutral-400">
                                    {column.title}
                                </span>
                                <span className="font-mono text-[10px] text-neutral-600">
                                    {column.cards.length + (stage === i ? 1 : 0)}
                                </span>
                            </div>
                            {stage === i && <ActiveCard stage={stage} animate={!reduceMotion} />}
                            {column.cards.map((card) => (
                                <StaticCard key={card.id} card={card} />
                            ))}
                            <div className="flex items-center gap-1 px-0.5 pt-0.5 text-[10px] text-neutral-600">
                                <AddIcon className="size-3" /> Add issue
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
