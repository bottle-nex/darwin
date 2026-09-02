"use client";
import type { IconType } from "@trymatcha/ui/icons";
import {
    CalendarIcon,
    ChatsNavIcon,
    DropdownCaretIcon,
    GanttNavIcon,
    GithubLogoIcon,
    InboxIcon,
    InProgressStatusIcon,
    InReviewStatusIcon,
    MergeIcon,
    MyIssuesIcon,
    PriorityFieldIcon,
    QueuedStatusIcon,
    RunnerIcon,
    SettingsIcon,
    SpaceEntityIcon,
    TagIcon,
    TodoStatusIcon,
} from "@trymatcha/ui/icons";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { MatchaLogo } from "@/components/logo/MatchaLogo";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { cn } from "@/lib/utils";

const SIDEBAR_NAV: { label: string; icon: IconType; badge?: string }[] = [
    { label: "Inbox", icon: InboxIcon, badge: "10" },
    { label: "My issues", icon: MyIssuesIcon },
    { label: "Chats", icon: ChatsNavIcon },
    { label: "Settings", icon: SettingsIcon },
];

const SIDEBAR_BOARD: { label: string; icon: IconType; active?: boolean }[] = [
    { label: "Spaces", icon: SpaceEntityIcon },
    { label: "Gantt", icon: GanttNavIcon },
    { label: "Tags", icon: TagIcon },
];

const SIDEBAR_TEAMS = [
    "Runners",
    "Agent Core",
    "Ingest",
    "Platform",
    "Web",
    "Integrations",
    "Reliability",
    "Security",
];

const TAG_DOTS: Record<string, string> = {
    bug: "bg-rose-400",
    database: "bg-sky-400",
    infra: "bg-blue-400",
    enhancement: "bg-emerald-400",
    dx: "bg-cyan-400",
    flaky: "bg-orange-400",
    feature: "bg-emerald-400",
    performance: "bg-yellow-400",
    agent: "bg-violet-400",
    runner: "bg-emerald-400",
    blocked: "bg-rose-400",
    security: "bg-pink-400",
};

type BoardCard = {
    id: string;
    title: string;
    tags: string[];
    date?: string;
    created: string;
    avatars: string[];
    pr?: string;
};

type BoardColumn = {
    title: string;
    count: number;
    icon: IconType;
    tint: string;
    cards: BoardCard[];
};

const COLUMNS: BoardColumn[] = [
    {
        title: "To Do",
        count: 30,
        icon: TodoStatusIcon,
        tint: "text-neutral-100",
        cards: [
            {
                id: "NOC-18",
                title: "Table insert regressed after the last theme migration",
                tags: ["performance"],
                date: "24 Sept",
                created: "Created 21 Aug",
                avatars: ["F"],
            },
            {
                id: "NOC-91",
                title: "Tool router reports success when nothing was written",
                tags: ["feature"],
                date: "27 Aug",
                created: "Created 19 Aug",
                avatars: ["N", "B"],
            },
            {
                id: "NOC-2",
                title: "Agent opens a PR before the verification pass has finished",
                tags: ["bug"],
                created: "Created 12 Aug",
                avatars: ["D", "J"],
            },
        ],
    },
    {
        title: "Queued",
        count: 30,
        icon: QueuedStatusIcon,
        tint: "text-[#50B5E2]",
        cards: [
            {
                id: "NOC-23",
                title: "Invite acceptance leaks memory across long sessions",
                tags: ["dx"],
                date: "3 Sept",
                created: "Created 19 Aug",
                avatars: ["A", "S"],
            },
            {
                id: "NOC-21",
                title: "Notification badge regressed after the last theme migration",
                tags: ["enhancement", "infra"],
                created: "Created 3 Aug",
                avatars: ["M", "T"],
            },
            {
                id: "NOC-27",
                title: "Add telemetry around connection pool",
                tags: ["bug"],
                date: "6 Aug",
                created: "Created 17 Jul",
                avatars: ["R"],
            },
            {
                id: "NOC-22",
                title: "Rework planning loop so retries are idempotent",
                tags: ["bug"],
                date: "24 Jul",
                created: "Created 30 Jun",
                avatars: ["B"],
            },
        ],
    },
    {
        title: "In Progress",
        count: 30,
        icon: InProgressStatusIcon,
        tint: "text-[#D69E1F]",
        cards: [
            {
                id: "NOC-33",
                title: "Surface OAuth callback state in the activity feed",
                tags: ["flaky"],
                created: "Created 12 Aug",
                avatars: ["A", "N"],
            },
            {
                id: "NOC-30",
                title: "Make verification pass recover cleanly from a dropped connection",
                tags: ["database"],
                date: "6 Sept",
                created: "Created 8 Aug",
                avatars: ["H"],
            },
            {
                id: "NOC-32",
                title: "Index coverage leaks memory across long sessions",
                tags: ["infra"],
                date: "10 Sept",
                created: "Created 8 Aug",
                avatars: ["J"],
            },
            {
                id: "NOC-34",
                title: "Paste handler leaks memory across long sessions",
                tags: ["enhancement", "security"],
                created: "Created 18 Jul",
                avatars: ["T"],
            },
        ],
    },
    {
        title: "In Review",
        count: 30,
        icon: InReviewStatusIcon,
        tint: "text-[#8999FF]",
        cards: [
            {
                id: "NOC-47",
                title: "Attempt lockout leaks memory across long sessions",
                tags: ["bug"],
                created: "Created 31 Jul",
                avatars: ["S"],
                pr: "#911",
            },
            {
                id: "NOC-44",
                title: "Optimistic echo timing breaks with large histories",
                tags: ["feature"],
                created: "Created 10 Jul",
                avatars: ["M"],
                pr: "#618",
            },
            {
                id: "NOC-48",
                title: "Grouped view silently drops updates under concurrent edits",
                tags: ["runner"],
                created: "Created 27 Jun",
                avatars: ["D"],
                pr: "#888",
            },
        ],
    },
];

const AVATAR_TONES = [
    "from-sky-500 to-indigo-600",
    "from-violet-500 to-fuchsia-600",
    "from-emerald-500 to-teal-600",
];

function SidebarRow({
    leading,
    label,
    badge,
    active,
}: {
    leading: React.ReactNode;
    label: string;
    badge?: string;
    active?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 rounded-[5px] py-1 pr-2.5 pl-2 font-medium tracking-wider",
                active ? "bg-active text-snow" : "text-snow/80",
            )}
        >
            <span className="flex size-5 shrink-0 items-center justify-center">{leading}</span>
            <span className="min-w-0 flex-1 truncate text-[12.5px]">{label}</span>
            {badge && (
                <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[8px] font-medium text-neutral-300 tabular-nums">
                    {badge}
                </span>
            )}
        </div>
    );
}

function SidebarSectionTitle({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-x-2 px-2 py-1.5 text-[12px] font-medium text-neutral-500 capitalize">
            <span>{title}</span>
            <DropdownCaretIcon className="size-3 text-neutral-500" />
        </div>
    );
}

function BoardCardView({ card }: { card: BoardCard }) {
    return (
        <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3.5 py-2.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-widest text-neutral-500 uppercase">
                    {card.id}
                </span>
                <div className="flex -space-x-1.5">
                    {card.avatars.map((letter, index) => (
                        <span
                            key={`${card.id}-${letter}-${index}`}
                            className={cn(
                                "flex size-4.5 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-semibold text-white ring-2 ring-[#0a0a0b]",
                                AVATAR_TONES[index % AVATAR_TONES.length],
                            )}
                        >
                            {letter}
                        </span>
                    ))}
                </div>
            </div>
            <p className="text-[12.5px] leading-snug text-neutral-200">{card.title}</p>
            <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
                <span className="flex h-5 shrink-0 items-center rounded-md border border-white/8 px-1.5">
                    <PriorityFieldIcon className="size-3 text-neutral-500" />
                </span>
                {card.tags.map((tag) => (
                    <span
                        key={tag}
                        className="flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-white/8 px-2 text-[10.5px] text-neutral-400"
                    >
                        <span className={cn("size-1.5 rounded-full", TAG_DOTS[tag])} />
                        {tag}
                    </span>
                ))}
                {card.date && (
                    <span className="flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-white/8 px-2 text-[10.5px] text-neutral-400">
                        <CalendarIcon className="size-3 text-amber-400/80" />
                        {card.date}
                    </span>
                )}
                {card.pr && (
                    <span className="flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-white/8 px-2 text-[10.5px] text-neutral-400">
                        <MergeIcon className="size-3 text-neutral-400" />
                        {card.pr}
                    </span>
                )}
            </div>
            <span className="text-[10.5px] text-neutral-600">{card.created}</span>
        </div>
    );
}

const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

const BORDER_INSET = 0.75;
const BORDER_RADIUS = 22;
const BORDER_TRACE_SECONDS = 2.2;

const FRAME_FADE = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.9, ease: ENTRANCE_EASE, delay: 1.7 } },
};

const MOCK_FADE = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.8, ease: ENTRANCE_EASE, delay: 2.0 } },
};

const CARD_STACK = {
    hidden: {},
    show: { transition: { staggerChildren: 0.14, delayChildren: 2.35 } },
};

const CARD_RISE = {
    hidden: { opacity: 0, x: 28, filter: "blur(6px)" },
    show: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: { duration: 0.55, ease: ENTRANCE_EASE },
    },
};

const HEADLINE_RISE = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ENTRANCE_EASE, delay: 2.6 } },
};

function OverlayCard({
    icon,
    title,
    meta,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    meta: string;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            variants={CARD_RISE}
            className="rounded-2xl border border-white/[0.05] bg-gradient-to-b from-white/[0.05] via-white/[0.03] to-white/[0.02] px-5 py-4 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex size-4 items-center justify-center text-neutral-400">
                        {icon}
                    </span>
                    <span className="text-[13px] font-medium text-neutral-200">{title}</span>
                </div>
                <span className="text-[11px] text-neutral-600">{meta}</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">{children}</p>
        </motion.div>
    );
}

export default function LandingHero() {
    const reduceMotion = useReducedMotion();
    const initial = reduceMotion ? false : "hidden";
    const frameRef = useRef<HTMLDivElement>(null);
    const [frame, setFrame] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = frameRef.current;
        if (!el) return;
        const measure = () =>
            setFrame((previous) =>
                previous.width === el.offsetWidth && previous.height === el.offsetHeight
                    ? previous
                    : { width: el.offsetWidth, height: el.offsetHeight },
            );
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const inset = BORDER_INSET;
    const radius = BORDER_RADIUS;
    const cornerX = inset;
    const cornerY = inset + radius;
    const topPath = `M ${cornerX} ${cornerY} A ${radius} ${radius} 0 0 1 ${inset + radius} ${inset} H ${frame.width - inset - radius} A ${radius} ${radius} 0 0 1 ${frame.width - inset} ${cornerY} V ${frame.height}`;
    const leftPath = `M ${cornerX} ${cornerY} V ${frame.height}`;
    const topLength = frame.width + frame.height - radius + Math.PI * radius;
    const leftLength = frame.height - radius;
    const leftSeconds = Math.max(0.7, BORDER_TRACE_SECONDS * (leftLength / topLength));

    return (
        <section className="relative h-svh min-h-175 w-full overflow-hidden text-snow">
            <div
                ref={frameRef}
                className="absolute inset-x-0 top-36 bottom-0 z-10 mx-auto w-[92%] max-w-[1300px]"
            >
                {frame.width > 0 && (
                    <svg
                        className="pointer-events-none absolute inset-0 z-30 h-full w-full"
                        viewBox={`0 0 ${frame.width} ${frame.height}`}
                        fill="none"
                    >
                        <motion.path
                            d={topPath}
                            initial={reduceMotion ? false : { pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{
                                duration: BORDER_TRACE_SECONDS,
                                ease: "easeInOut",
                                delay: 0.15,
                            }}
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth="1.5"
                            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.22))" }}
                        />
                        <motion.path
                            d={leftPath}
                            initial={reduceMotion ? false : { pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: leftSeconds, ease: "easeInOut", delay: 0.15 }}
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth="1.5"
                            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.22))" }}
                        />
                    </svg>
                )}
                <div className="pointer-events-none absolute -inset-y-1 -right-1 z-40 w-[30%] bg-gradient-to-l from-ink from-10% via-ink/75 to-transparent" />
                <motion.div
                    initial={initial}
                    animate="show"
                    variants={FRAME_FADE}
                    className="flex h-full flex-col rounded-t-[22px] overflow-hidden bg-linear-to-b from-[#1b1b1d] to-[#0c0c0d] pb-0"
                >
                    <div className="relative flex-1 overflow-hidden rounded-t-[21px] bg-[#070708]">
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 overflow-hidden">
                            <div className="absolute -top-24 left-[6%] h-72 w-[28%] rotate-[16deg] bg-gradient-to-b from-white/14 to-transparent blur-2xl" />
                            <div className="absolute -top-28 left-[42%] h-80 w-[20%] rotate-[-10deg] bg-gradient-to-b from-white/9 to-transparent blur-3xl" />
                            <div className="absolute -top-20 right-[8%] h-64 w-[26%] rotate-[14deg] bg-gradient-to-b from-white/12 to-transparent blur-2xl" />
                            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/6 to-transparent" />
                        </div>

                        <motion.div
                            initial={initial}
                            animate="show"
                            variants={MOCK_FADE}
                            className="relative flex h-full gap-1.5 p-2"
                        >
                            <aside className="flex w-52 shrink-0 flex-col gap-3 overflow-hidden rounded-xl border-[1.5px] border-snow/5 bg-charcoal/70 px-2 pt-3">
                                <div className="flex items-center gap-2 px-2">
                                    <PlaygroundAvatar letter="NO" tone="blue" size="md" />
                                    <span className="text-[13px] font-semibold text-neutral-100">
                                        Nocturn
                                    </span>
                                    <DropdownCaretIcon className="size-3 text-neutral-500" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {SIDEBAR_NAV.map((row) => (
                                        <SidebarRow
                                            key={row.label}
                                            label={row.label}
                                            badge={row.badge}
                                            leading={
                                                <row.icon className="size-3.75 text-snow/80" />
                                            }
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <SidebarSectionTitle title="Board" />
                                    <SidebarRow
                                        label="Agent"
                                        active
                                        leading={<HeroBuddy move={false} className="size-4" />}
                                    />
                                    {SIDEBAR_BOARD.map((row) => (
                                        <SidebarRow
                                            key={row.label}
                                            label={row.label}
                                            leading={
                                                <row.icon className="size-3.75 text-snow/80" />
                                            }
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <SidebarSectionTitle title="Teams" />
                                    {SIDEBAR_TEAMS.map((team) => (
                                        <SidebarRow
                                            key={team}
                                            label={team}
                                            leading={
                                                <PlaygroundAvatar
                                                    letter={team.charAt(0).toUpperCase()}
                                                    tone="indigo"
                                                    size="sm"
                                                />
                                            }
                                        />
                                    ))}
                                </div>
                            </aside>

                            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border-[1.5px] border-snow/5 bg-charcoal/70">
                                <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-white/5 px-5 text-[12px] text-neutral-400">
                                    <span>Nocturn</span>
                                    <span className="text-neutral-600">›</span>
                                    <span className="text-neutral-200">Agent</span>
                                </div>
                                <div className="flex min-h-0 flex-1 gap-5 overflow-hidden px-5 pt-4">
                                    {COLUMNS.map((column) => (
                                        <div
                                            key={column.title}
                                            className="flex w-66 shrink-0 flex-col gap-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <column.icon
                                                    className={cn("size-3.5", column.tint)}
                                                />
                                                <span
                                                    className={cn(
                                                        "text-[12.5px] font-semibold",
                                                        column.tint,
                                                    )}
                                                >
                                                    {column.title}
                                                </span>
                                                <span className="text-[11.5px] text-neutral-500">
                                                    {column.count}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                {column.cards.map((card) => (
                                                    <BoardCardView key={card.id} card={card} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[42%] bg-gradient-to-l from-[#070708] from-25% via-[#070708]/80 to-transparent" />
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={initial}
                animate="show"
                variants={CARD_STACK}
                className="absolute top-[26%] right-[2.5%] z-30 flex w-100 flex-col gap-4"
            >
                <div className="absolute -inset-12 -z-10 rounded-[48px] bg-black/40 blur-3xl" />
                <OverlayCard
                    icon={<MatchaLogo className="h-2.5 w-auto text-snow" />}
                    title="Morning recap"
                    meta="Summarized at 9:41 AM"
                >
                    Overnight the agents closed 6 issues and opened 3 pull requests. Two runners are
                    still verifying fixes, and NOC-128 is waiting on your review before merge.{" "}
                    <span className="cursor-pointer text-neutral-100 underline underline-offset-2">
                        Read more
                    </span>
                </OverlayCard>
                <OverlayCard
                    icon={<MergeIcon className="size-3.5 text-matcha" />}
                    title="PR opened"
                    meta="Today · Just now"
                >
                    An agent shipped #128 — flaky webhook retries fixed. Build green, 412 tests
                    passing in the sandbox before the PR went up.
                </OverlayCard>
                <OverlayCard
                    icon={<RunnerIcon className="size-3.5 text-neutral-200" />}
                    title="Runner verified"
                    meta="Today · 2 min ago"
                >
                    A sandboxed runner cloned your repo, reproduced the bug, and ran the full suite
                    against the fix before opening the pull request.
                </OverlayCard>
                <OverlayCard
                    icon={<GithubLogoIcon className="size-3.5 text-neutral-200" />}
                    title="Review requested"
                    meta="Today · 12 min ago"
                >
                    NOC-131 is ready — the agent requested your review and posted a summary of every
                    file it touched.
                </OverlayCard>
            </motion.div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-112 bg-gradient-to-t from-ink from-28% via-ink/70 via-60% to-transparent" />

            <motion.div
                initial={initial}
                animate="show"
                variants={HEADLINE_RISE}
                className="absolute inset-x-0 bottom-12 z-30 mx-auto w-[92%] max-w-[1300px]"
            >
                <div className="text-xl font-semibold text-neutral-500">matcha</div>
                <h1 className="mt-2 text-[56px] leading-none font-medium tracking-tight text-[#e2e2e2]">
                    Make issues ship themselves.
                </h1>
            </motion.div>
        </section>
    );
}
