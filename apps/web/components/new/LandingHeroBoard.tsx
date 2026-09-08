"use client";
import type { IconType } from "@trydarwin/ui/icons";
import {
    CalendarIcon,
    ChatsNavIcon,
    DropdownCaretIcon,
    GanttNavIcon,
    InboxIcon,
    InProgressStatusIcon,
    InReviewStatusIcon,
    MergeIcon,
    MyIssuesIcon,
    PriorityFieldIcon,
    QueuedStatusIcon,
    SettingsIcon,
    SpaceEntityIcon,
    TagIcon,
    TodoStatusIcon,
} from "@trydarwin/ui/icons";
import { motion, useReducedMotion } from "motion/react";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { MOCK_FADE } from "@/components/new/landingHeroMotion";
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
    bug: "bg-rose-500",
    database: "bg-sky-500",
    infra: "bg-blue-500",
    enhancement: "bg-emerald-500",
    dx: "bg-cyan-500",
    flaky: "bg-orange-500",
    feature: "bg-emerald-500",
    performance: "bg-yellow-500",
    agent: "bg-violet-500",
    runner: "bg-emerald-500",
    blocked: "bg-rose-500",
    security: "bg-pink-500",
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
        tint: "text-foreground/75",
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
        tint: "text-[#2A7FAE]",
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
        tint: "text-[#9C700F]",
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
        tint: "text-[#5462CE]",
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
                active ? "bg-active text-foreground" : "text-foreground/70",
            )}
        >
            <span className="flex size-5 shrink-0 items-center justify-center">{leading}</span>
            <span className="min-w-0 flex-1 truncate text-[12.5px]">{label}</span>
            {badge && (
                <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground/8 text-[8px] font-medium text-muted-foreground tabular-nums">
                    {badge}
                </span>
            )}
        </div>
    );
}

function SidebarSectionTitle({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-x-2 px-2 py-1.5 text-[12px] font-medium text-muted-foreground capitalize">
            <span>{title}</span>
            <DropdownCaretIcon className="size-3 text-muted-foreground" />
        </div>
    );
}

function BoardCardView({ card }: { card: BoardCard }) {
    return (
        <div className="flex flex-col gap-2 rounded-lg border border-edge bg-snow px-3.5 py-2.5 shadow-[0_1px_2px_rgba(24,24,27,0.05)]">
            <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
                    {card.id}
                </span>
                <div className="flex -space-x-1.5">
                    {card.avatars.map((letter, index) => (
                        <span
                            key={`${card.id}-${letter}-${index}`}
                            className={cn(
                                "flex size-4.5 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-semibold text-white ring-2 ring-snow",
                                AVATAR_TONES[index % AVATAR_TONES.length],
                            )}
                        >
                            {letter}
                        </span>
                    ))}
                </div>
            </div>
            <p className="text-[12.5px] leading-snug text-foreground">{card.title}</p>
            <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
                <span className="flex h-5 shrink-0 items-center rounded-md border border-edge px-1.5">
                    <PriorityFieldIcon className="size-3 text-muted-foreground" />
                </span>
                {card.tags.map((tag) => (
                    <span
                        key={tag}
                        className="flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-edge px-2 text-[10.5px] text-muted-foreground"
                    >
                        <span className={cn("size-1.5 rounded-full", TAG_DOTS[tag])} />
                        {tag}
                    </span>
                ))}
                {card.date && (
                    <span className="flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-edge px-2 text-[10.5px] text-muted-foreground">
                        <CalendarIcon className="size-3 text-amber-600" />
                        {card.date}
                    </span>
                )}
                {card.pr && (
                    <span className="flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-edge px-2 text-[10.5px] text-muted-foreground">
                        <MergeIcon className="size-3 text-muted-foreground" />
                        {card.pr}
                    </span>
                )}
            </div>
            <span className="text-[10.5px] text-muted-foreground/70">{card.created}</span>
        </div>
    );
}
export default function LandingHeroBoard() {
    const reduceMotion = useReducedMotion();
    const initial = reduceMotion ? false : "hidden";

    return (
        <motion.div
            initial={initial}
            animate="show"
            variants={MOCK_FADE}
            className="relative flex h-full gap-1.5 p-2"
        >
            <aside className="flex w-52 shrink-0 flex-col gap-3 overflow-hidden rounded-xl border-[1.5px] border-edge bg-charcoal px-2 pt-3">
                <div className="flex items-center gap-2 px-2">
                    <PlaygroundAvatar letter="NO" tone="blue" size="md" />
                    <span className="text-[13px] font-semibold text-foreground">Nocturn</span>
                    <DropdownCaretIcon className="size-3 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-0.5">
                    {SIDEBAR_NAV.map((row) => (
                        <SidebarRow
                            key={row.label}
                            label={row.label}
                            badge={row.badge}
                            leading={<row.icon className="size-3.75 text-foreground/70" />}
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
                            leading={<row.icon className="size-3.75 text-foreground/70" />}
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

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border-[1.5px] border-edge bg-charcoal">
                <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-edge px-5 text-[12px] text-muted-foreground">
                    <span>Nocturn</span>
                    <span className="text-muted-foreground/70">›</span>
                    <span className="text-foreground">Agent</span>
                </div>
                <div className="flex min-h-0 flex-1 gap-5 overflow-hidden px-5 pt-4">
                    {COLUMNS.map((column) => (
                        <div key={column.title} className="flex w-66 shrink-0 flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <column.icon className={cn("size-3.5", column.tint)} />
                                <span className={cn("text-[12.5px] font-semibold", column.tint)}>
                                    {column.title}
                                </span>
                                <span className="text-[11.5px] text-muted-foreground">
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
    );
}
