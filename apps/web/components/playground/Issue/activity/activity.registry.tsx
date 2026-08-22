"use client";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
    LuActivity,
    LuAlignLeft,
    LuCircleDashed,
    LuCircleX,
    LuGitPullRequest,
    LuPencil,
    LuPlay,
    LuTag,
    LuUserMinus,
    LuUserPlus,
} from "react-icons/lu";
import { RiSignalCellular2Fill } from "react-icons/ri";
import { IoPencilSharp } from "react-icons/io5";
import { HiCalendar } from "react-icons/hi2";
import { MdOutlineSupportAgent } from "react-icons/md";
import {
    ActivityType,
    type ActivityLocationRef,
    type ActivityPayload,
    type ActivityPayloadMap,
} from "@trymatcha/types";
import { formatDate } from "@/lib/format";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { DATE_ICON_COLOR, PRIORITY_OPTIONS } from "../issueHelpers";
import TextDiff from "./TextDiff";

/** Every other status already reads as a word. */
const STATUS_LABEL: Record<string, string> = {
    InProgress: "In Progress",
    InReview: "In Review",
};

/** A custom column reads as its own name; a built-in status as its label. */
function location_label(location: ActivityLocationRef | undefined): string {
    if (!location) return "unknown";
    if (location.kind === "column") return location.label;
    return STATUS_LABEL[location.status] ?? location.status;
}

type Glyph = { icon: IconType; iconClassName: string };

function location_glyph(location: ActivityLocationRef | undefined): Glyph | undefined {
    if (location?.kind !== "status") return undefined;
    const column = KanbanBoard.columnFor(location.status);
    return column ? { icon: column.icon, iconClassName: column.titleBox } : undefined;
}

function priority_option(rank: number | undefined) {
    return PRIORITY_OPTIONS.find((option) => option.rank === rank);
}

function priority_label(rank: number | undefined): string {
    return priority_option(rank)?.label ?? "No priority";
}

function priority_glyph(rank: number | undefined): Glyph | undefined {
    const option = priority_option(rank);
    return option
        ? { icon: option.icon, iconClassName: option.iconClassName ?? "text-neutral-400" }
        : undefined;
}

function dates_glyph(from: DateRange | undefined, to: DateRange | undefined): Glyph {
    const startMoved = from?.startDate !== to?.startDate;
    return {
        icon: HiCalendar,
        iconClassName: startMoved ? DATE_ICON_COLOR.start : DATE_ICON_COLOR.target,
    };
}

/** "PrChecksFailed" -> "pr checks failed", for types that have no template yet. */
function humanize(type: ActivityType): string {
    return type.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
}

function Pill({ children }: { children: ReactNode }) {
    return (
        <span className="rounded-[4px] bg-graphite px-1.5 py-0.5 text-[12px] font-medium text-neutral-300">
            {children}
        </span>
    );
}

function Strong({ children }: { children: ReactNode }) {
    return <span className="font-medium text-neutral-300">{children}</span>;
}

function LabelChip({ label }: { label: { name: string; color: string } | undefined }) {
    if (!label) return <Pill>a label</Pill>;
    return (
        <span className="inline-flex items-center gap-x-1.5 rounded-[4px] bg-graphite px-1.5 py-0.5 text-[12px] font-medium text-neutral-300">
            <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: label.color }}
            />
            {label.name}
        </span>
    );
}

type DateRange = { startDate: string | null; targetDate: string | null };

/** Start and target move independently, so one edit can read "set … and cleared …". */
function dates_predicate(from: DateRange | undefined, to: DateRange | undefined): ReactNode {
    if (!to) return "changed the dates";
    const parts: ReactNode[] = [];
    for (const [field, noun] of [
        ["startDate", "start date"],
        ["targetDate", "target date"],
    ] as const) {
        const next = to[field];
        if (from?.[field] === next) continue;
        parts.push(
            next ? (
                <span key={field}>
                    set the {noun} to <Pill>{formatDate(next)}</Pill>
                </span>
            ) : (
                <span key={field}>cleared the {noun}</span>
            ),
        );
    }
    if (!parts.length) return "changed the dates";
    if (parts.length === 1) return parts[0];
    return (
        <>
            {parts[0]} and {parts[1]}
        </>
    );
}

type ActivityEntry<K extends ActivityType> = {
    icon: IconType;
    iconClassName: string;
    glyph?: (payload: ActivityPayloadMap[K]) => Glyph | undefined;
    render: (payload: ActivityPayloadMap[K]) => ReactNode;
    detail?: (payload: ActivityPayloadMap[K]) => ReactNode;
    summary?: string;
};

const REGISTRY: { [K in ActivityType]?: ActivityEntry<K> } = {
    [ActivityType.IssueCreated]: {
        icon: IoPencilSharp,
        iconClassName: "text-neutral-400",
        render: () => "created the issue",
        summary: "created the issue",
    },
    [ActivityType.StatusChanged]: {
        icon: LuCircleDashed,
        iconClassName: "text-[#F1BF00]",
        glyph: (payload) => location_glyph(payload.to),
        render: (payload) => (
            <>
                moved this from <Pill>{location_label(payload.from)}</Pill> to{" "}
                <Pill>{location_label(payload.to)}</Pill>
            </>
        ),
        summary: "changed status",
    },
    [ActivityType.PriorityChanged]: {
        icon: RiSignalCellular2Fill,
        iconClassName: "text-neutral-400",
        glyph: (payload) => priority_glyph(payload.to),
        render: (payload) => (
            <>
                changed priority from <Pill>{priority_label(payload.from)}</Pill> to{" "}
                <Pill>{priority_label(payload.to)}</Pill>
            </>
        ),
        summary: "changed priority",
    },
    [ActivityType.TitleChanged]: {
        icon: LuPencil,
        iconClassName: "text-neutral-300",
        render: (payload) => (
            <>
                changed the title to <Strong>{payload.to}</Strong>
            </>
        ),
        detail: (payload) => <TextDiff before={payload.from} after={payload.to} />,
        summary: "changed the title",
    },
    [ActivityType.DescriptionChanged]: {
        icon: LuAlignLeft,
        iconClassName: "text-neutral-300",
        render: () => "updated the description",
        summary: "updated the description",
    },
    [ActivityType.AssigneeAdded]: {
        icon: LuUserPlus,
        iconClassName: "text-emerald-300",
        render: (payload) => (
            <>
                assigned <Strong>{payload.user?.name ?? "someone"}</Strong>
            </>
        ),
        summary: "changed assignees",
    },
    [ActivityType.AssigneeRemoved]: {
        icon: LuUserMinus,
        iconClassName: "text-emerald-300",
        render: (payload) => (
            <>
                unassigned <Strong>{payload.user?.name ?? "someone"}</Strong>
            </>
        ),
        summary: "changed assignees",
    },
    [ActivityType.LabelAdded]: {
        icon: LuTag,
        iconClassName: "text-violet-400",
        render: (payload) => (
            <>
                added <LabelChip label={payload.label} />
            </>
        ),
        summary: "changed labels",
    },
    [ActivityType.LabelRemoved]: {
        icon: LuTag,
        iconClassName: "text-violet-400",
        render: (payload) => (
            <>
                removed <LabelChip label={payload.label} />
            </>
        ),
        summary: "changed labels",
    },
    [ActivityType.DatesChanged]: {
        icon: HiCalendar,
        iconClassName: DATE_ICON_COLOR.start,
        glyph: (payload) => dates_glyph(payload.from, payload.to),
        render: (payload) => dates_predicate(payload.from, payload.to),
        summary: "changed dates",
    },
    [ActivityType.RunStarted]: {
        icon: LuPlay,
        iconClassName: "text-amber-300",
        render: (payload) => `started attempt ${payload.attemptNumber}`,
        summary: "started an attempt",
    },
    [ActivityType.RunCompleted]: {
        icon: MdOutlineSupportAgent,
        iconClassName: "text-neutral-400",
        render: (payload) => `finished attempt ${payload.attemptNumber}`,
        summary: "finished an attempt",
    },
    [ActivityType.AttemptFailed]: {
        icon: LuCircleX,
        iconClassName: "text-red-300",
        render: (payload) => (
            <>
                failed attempt {payload.attemptNumber} — {payload.reason}
            </>
        ),
        summary: "failed an attempt",
    },
    [ActivityType.PrOpened]: {
        icon: LuGitPullRequest,
        iconClassName: "text-violet-400",
        render: (payload) => (
            <>
                opened{" "}
                <a
                    href={payload.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-neutral-300 underline decoration-edge underline-offset-2 hover:text-mist"
                >
                    a pull request
                </a>
            </>
        ),
        summary: "opened a pull request",
    },
};

/** What a type without a template falls back to, alongside {@link LuActivity}. */
const UNTEMPLATED_TONE = "text-neutral-500";

type ResolvedEntry = {
    glyph: (payload: ActivityPayload | null) => Glyph;
    render: (payload: ActivityPayload | null) => ReactNode;
    detail: ((payload: ActivityPayload | null) => ReactNode) | null;
    summary: string;
};

export function activity_entry(type: ActivityType): ResolvedEntry {
    // Each entry is checked against its own key above; the lookup itself can't
    // carry that correlation, so it widens to an opaque payload here.
    const entry = REGISTRY[type] as
        | {
              icon: IconType;
              iconClassName: string;
              glyph?: (payload: never) => Glyph | undefined;
              render: (payload: never) => ReactNode;
              detail?: (payload: never) => ReactNode;
              summary?: string;
          }
        | undefined;
    if (!entry) {
        return {
            glyph: () => ({ icon: LuActivity, iconClassName: UNTEMPLATED_TONE }),
            render: () => humanize(type),
            detail: null,
            summary: humanize(type),
        };
    }
    const { glyph, detail } = entry;
    const fallback: Glyph = { icon: entry.icon, iconClassName: entry.iconClassName };
    return {
        glyph: (payload) => glyph?.((payload ?? {}) as never) ?? fallback,
        render: (payload) => entry.render((payload ?? {}) as never),
        detail: detail ? (payload) => detail((payload ?? {}) as never) : null,
        summary: entry.summary ?? humanize(type),
    };
}
