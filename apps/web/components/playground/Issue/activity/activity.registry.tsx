"use client";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
    LuActivity,
    LuAlignLeft,
    LuCalendar,
    LuCircleCheck,
    LuCircleDashed,
    LuCirclePlus,
    LuCircleX,
    LuGitPullRequest,
    LuPencil,
    LuPlay,
    LuTag,
    LuUserMinus,
    LuUserPlus,
} from "react-icons/lu";
import { RiSignalCellular2Fill } from "react-icons/ri";
import {
    ActivityType,
    type ActivityLocationRef,
    type ActivityPayload,
    type ActivityPayloadMap,
} from "@trymatcha/types";
import { formatDate } from "@/lib/format";
import { PRIORITY_OPTIONS } from "../issueHelpers";
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

function priority_label(rank: number | undefined): string {
    return PRIORITY_OPTIONS.find((option) => option.rank === rank)?.label ?? "No priority";
}

/** "PrChecksFailed" -> "pr checks failed", for types that have no template yet. */
function humanize(type: ActivityType): string {
    return type.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
}

function Pill({ children }: { children: ReactNode }) {
    return (
        <span className="rounded-[4px] bg-white/6 px-1.5 py-0.5 text-[12px] font-medium text-neutral-300">
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
        <span className="inline-flex items-center gap-x-1.5 rounded-[4px] bg-white/6 px-1.5 py-0.5 text-[12px] font-medium text-neutral-300">
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
    /** The predicate that follows the actor's name, e.g. "changed status from …". */
    render: (payload: ActivityPayloadMap[K]) => ReactNode;
    /**
     * Optional hover panel. The row states the new value; this is where the
     * edit's before and after are worth seeing side by side.
     */
    detail?: (payload: ActivityPayloadMap[K]) => ReactNode;
};

/**
 * One entry per event type that has a template. Types without one fall back to
 * their humanized name, so a new writer only ever has to add a line here.
 */
const REGISTRY: { [K in ActivityType]?: ActivityEntry<K> } = {
    [ActivityType.IssueCreated]: {
        icon: LuCirclePlus,
        render: () => "created the issue",
    },
    [ActivityType.StatusChanged]: {
        icon: LuCircleDashed,
        render: (payload) => (
            <>
                moved this from <Pill>{location_label(payload.from)}</Pill> to{" "}
                <Pill>{location_label(payload.to)}</Pill>
            </>
        ),
    },
    [ActivityType.PriorityChanged]: {
        icon: RiSignalCellular2Fill,
        render: (payload) => (
            <>
                changed priority from <Pill>{priority_label(payload.from)}</Pill> to{" "}
                <Pill>{priority_label(payload.to)}</Pill>
            </>
        ),
    },
    [ActivityType.TitleChanged]: {
        icon: LuPencil,
        render: (payload) => (
            <>
                changed the title to <Strong>{payload.to}</Strong>
            </>
        ),
        detail: (payload) => <TextDiff before={payload.from} after={payload.to} />,
    },
    [ActivityType.DescriptionChanged]: {
        icon: LuAlignLeft,
        render: () => "updated the description",
    },
    [ActivityType.AssigneeAdded]: {
        icon: LuUserPlus,
        render: (payload) => (
            <>
                assigned <Strong>{payload.user?.name ?? "someone"}</Strong>
            </>
        ),
    },
    [ActivityType.AssigneeRemoved]: {
        icon: LuUserMinus,
        render: (payload) => (
            <>
                unassigned <Strong>{payload.user?.name ?? "someone"}</Strong>
            </>
        ),
    },
    [ActivityType.LabelAdded]: {
        icon: LuTag,
        render: (payload) => (
            <>
                added <LabelChip label={payload.label} />
            </>
        ),
    },
    [ActivityType.LabelRemoved]: {
        icon: LuTag,
        render: (payload) => (
            <>
                removed <LabelChip label={payload.label} />
            </>
        ),
    },
    [ActivityType.DatesChanged]: {
        icon: LuCalendar,
        render: (payload) => dates_predicate(payload.from, payload.to),
    },
    [ActivityType.RunStarted]: {
        icon: LuPlay,
        render: (payload) => `started attempt ${payload.attemptNumber}`,
    },
    [ActivityType.RunCompleted]: {
        icon: LuCircleCheck,
        render: (payload) => `finished attempt ${payload.attemptNumber}`,
    },
    [ActivityType.AttemptFailed]: {
        icon: LuCircleX,
        render: (payload) => (
            <>
                failed attempt {payload.attemptNumber} — {payload.reason}
            </>
        ),
    },
    [ActivityType.PrOpened]: {
        icon: LuGitPullRequest,
        render: (payload) => (
            <>
                opened{" "}
                <a
                    href={payload.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-neutral-300 underline decoration-white/20 underline-offset-2 hover:text-white"
                >
                    a pull request
                </a>
            </>
        ),
    },
};

type ResolvedEntry = {
    icon: IconType;
    render: (payload: ActivityPayload | null) => ReactNode;
    detail: ((payload: ActivityPayload | null) => ReactNode) | null;
};

export function activity_entry(type: ActivityType): ResolvedEntry {
    // Each entry is checked against its own key above; the lookup itself can't
    // carry that correlation, so it widens to an opaque payload here.
    const entry = REGISTRY[type] as
        | {
              icon: IconType;
              render: (payload: never) => ReactNode;
              detail?: (payload: never) => ReactNode;
          }
        | undefined;
    if (!entry) return { icon: LuActivity, render: () => humanize(type), detail: null };
    const detail = entry.detail;
    return {
        icon: entry.icon,
        render: (payload) => entry.render((payload ?? {}) as never),
        detail: detail ? (payload) => detail((payload ?? {}) as never) : null,
    };
}
