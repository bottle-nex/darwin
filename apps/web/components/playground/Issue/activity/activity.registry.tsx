"use client";
import {
    type ActivityLocationRef,
    type ActivityPayload,
    type ActivityPayloadMap,
    ActivityType,
} from "@trymatcha/types";
import type { IconType } from "@trymatcha/ui/icons";
import {
    AssigneeAddedActivityIcon,
    AssigneeRemovedActivityIcon,
    CalendarIcon,
    ComposeIssueIcon,
    DescriptionChangedActivityIcon,
    EditIcon,
    ErrorCircleIcon,
    HarnessIcon,
    MergeIcon,
    PriorityChangedActivityIcon,
    PullRequestClosedIcon,
    PullRequestOpenIcon,
    RunCompletedActivityIcon,
    RunStartedActivityIcon,
    StatusChangedActivityIcon,
    TagIcon,
    UntrackedActivityIcon,
} from "@trymatcha/ui/icons";
import { type ComponentProps, forwardRef, type ReactNode } from "react";

import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { formatDate } from "@/lib/format";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import { KanbanStatus } from "@/types/kanban";

import { DATE_ICON_COLOR, PRIORITY_OPTIONS } from "../issueHelpers";
import TextDiff from "./TextDiff";

/** Every other status already reads as a word. */
const STATUS_LABEL: Record<string, string> = {
    Todo: "To Do",
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
        icon: CalendarIcon,
        iconClassName: startMoved ? DATE_ICON_COLOR.start : DATE_ICON_COLOR.target,
    };
}

function harness_config_label(
    ref: { harness: string; model: string | null; effort: string | null } | null,
) {
    if (!ref) return "nothing";
    const parts = [ref.harness, ref.model].filter(Boolean);
    return ref.effort ? `${parts.join(" · ")} (${ref.effort})` : parts.join(" · ");
}

/** "PrChecksFailed" -> "pr checks failed", for types that have no template yet. */
function humanize(type: ActivityType): string {
    return type.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
}

const Pill = forwardRef<HTMLSpanElement, ComponentProps<"span">>(function Pill(
    { children, className, ...props },
    ref,
) {
    return (
        <span
            ref={ref}
            className={cn(
                "rounded-[4px] bg-graphite px-1.5 py-0.5 text-[12px] font-medium text-neutral-300",
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
});

function Strong({ children }: { children: ReactNode }) {
    return <span className="font-medium text-neutral-300">{children}</span>;
}

function LabelChip({ label }: { label: { name: string; color: string } | undefined }) {
    if (!label) return <Pill>a label</Pill>;
    return <TagDisplay name={label.name} color={label.color} className="align-middle" />;
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

const MUTED_ICON_COLOR = "text-snow/70";

const REGISTRY: { [K in ActivityType]?: ActivityEntry<K> } = {
    [ActivityType.IssueCreated]: {
        icon: ComposeIssueIcon,
        iconClassName: "text-neutral-400",
        render: () => "created the issue",
        summary: "created the issue",
    },
    [ActivityType.StatusChanged]: {
        icon: StatusChangedActivityIcon,
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
        icon: PriorityChangedActivityIcon,
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
        icon: EditIcon,
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
        icon: DescriptionChangedActivityIcon,
        iconClassName: "text-neutral-300",
        render: () => "updated the description",
        summary: "updated the description",
    },
    [ActivityType.AssigneeAdded]: {
        icon: AssigneeAddedActivityIcon,
        iconClassName: MUTED_ICON_COLOR,
        render: (payload) => (
            <>
                assigned <Strong>{payload.user?.name ?? "someone"}</Strong>
            </>
        ),
        summary: "changed assignees",
    },
    [ActivityType.AssigneeRemoved]: {
        icon: AssigneeRemovedActivityIcon,
        iconClassName: MUTED_ICON_COLOR,
        render: (payload) => (
            <>
                unassigned <Strong>{payload.user?.name ?? "someone"}</Strong>
            </>
        ),
        summary: "changed assignees",
    },
    [ActivityType.LabelAdded]: {
        icon: TagIcon,
        iconClassName: MUTED_ICON_COLOR,
        render: (payload) => (
            <>
                added <LabelChip label={payload.label} />
            </>
        ),
        summary: "changed labels",
    },
    [ActivityType.LabelRemoved]: {
        icon: TagIcon,
        iconClassName: MUTED_ICON_COLOR,
        render: (payload) => (
            <>
                removed <LabelChip label={payload.label} />
            </>
        ),
        summary: "changed labels",
    },
    [ActivityType.DatesChanged]: {
        icon: CalendarIcon,
        iconClassName: DATE_ICON_COLOR.start,
        glyph: (payload) => dates_glyph(payload.from, payload.to),
        render: (payload) => dates_predicate(payload.from, payload.to),
        summary: "changed dates",
    },
    [ActivityType.RunStarted]: {
        icon: RunStartedActivityIcon,
        iconClassName: "text-snow/60",
        render: (payload) => `started attempt ${payload.attemptNumber}`,
        summary: "started an attempt",
    },
    [ActivityType.RunCompleted]: {
        icon: RunCompletedActivityIcon,
        iconClassName: "text-snow/60",
        render: (payload) => `finished attempt ${payload.attemptNumber}`,
        summary: "finished an attempt",
    },
    [ActivityType.AttemptFailed]: {
        icon: ErrorCircleIcon,
        iconClassName: "text-red-300",
        render: (payload) => (
            <>
                failed attempt {payload.attemptNumber} — {payload.reason}
            </>
        ),
        summary: "failed an attempt",
    },
    [ActivityType.HarnessConfigChanged]: {
        icon: HarnessIcon,
        iconClassName: "text-neutral-500 ",
        render: (payload) => (
            <>
                set the agent to{" "}
                <InfoTooltip
                    content={
                        payload.from ? (
                            <span className="text-[12px] text-neutral-400">
                                was {harness_config_label(payload.from)}
                            </span>
                        ) : null
                    }
                >
                    <Pill
                        className={
                            payload.from
                                ? "cursor-default underline decoration-edge decoration-dotted underline-offset-4 hover:decoration-neutral-500"
                                : undefined
                        }
                    >
                        {harness_config_label(payload.to)}
                    </Pill>
                </InfoTooltip>
            </>
        ),
        summary: "changed the agent config",
    },
    [ActivityType.PrOpened]: {
        icon: PullRequestOpenIcon,
        iconClassName: KanbanBoard.glyphFor(KanbanStatus.InReview).titleBox,
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
    [ActivityType.PrMerged]: {
        icon: MergeIcon,
        iconClassName: KanbanBoard.glyphFor(KanbanStatus.Done).titleBox,
        render: (payload) => (
            <>
                merged{" "}
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
        summary: "merged a pull request",
    },
    [ActivityType.PrClosed]: {
        icon: PullRequestClosedIcon,
        iconClassName: "text-rose-400",
        render: (payload) => (
            <>
                closed{" "}
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
        summary: "closed a pull request",
    },
};

/** What a type without a template falls back to, alongside {@link UntrackedActivityIcon}. */
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
            glyph: () => ({ icon: UntrackedActivityIcon, iconClassName: UNTEMPLATED_TONE }),
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
