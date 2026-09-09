import { ClockIcon, CommentCountIcon, PausedStateIcon } from "@trydarwin/ui/icons";

import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { GanttTimeline } from "@/lib/gantt/GanttTimeline";
import { cn } from "@/lib/utils";
import type { GanttIssue } from "@/types/gantt";

import { BLURRED_BG_TWO } from "../KanbanDisplay/cardStyles";

export default function GanttIssueCard({ issue, now }: { issue: GanttIssue; now: number }) {
    const identifier = useIssueIdentifier();
    const { left, width } = GanttTimeline.barGeometry(issue, now);
    const isSolving = issue.status === "solving";
    const isQueued = issue.status === "queued";
    const isDone = issue.status === "done";
    const isPaused = isSolving && issue.pausedAt != null;

    const accent = isPaused
        ? "var(--color-warning)"
        : isDone
          ? "var(--color-success)"
          : isSolving
            ? "#3b82f6"
            : "var(--color-primary)";
    const statusLabel = isPaused
        ? "Paused"
        : isDone
          ? "Done"
          : isSolving
            ? "In progress"
            : "Queued";

    const pausedMinutes = isPaused ? Math.max(0, Math.round(now - issue.pausedAt!)) : 0;
    const pauseLineWidth = isPaused
        ? Math.max(0, (now - issue.pausedAt!) * GanttTimeline.MINUTE_WIDTH)
        : 0;
    const AMBER_DASH = "repeating-linear-gradient(to right, #f59e0b 0 4px, transparent 4px 8px)";

    return (
        <>
            <TooltipComponent content={`${identifier(issue.number)} · ${issue.title}`}>
                <div
                    className={cn(
                        "absolute inset-y-2 z-1 overflow-hidden rounded-md border border-border",
                        isQueued && "border-dashed",
                        BLURRED_BG_TWO(true),
                    )}
                    style={{
                        left,
                        width,
                    }}
                >
                    <div className="flex h-full flex-col py-2.5 pl-3 pr-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <span
                                    className={cn(
                                        "size-1.5 shrink-0 rounded-full",
                                        isSolving && !isPaused && "animate-pulse",
                                        GanttTimeline.PRIORITY_DOT[issue.priority],
                                    )}
                                />
                                {issue.label && (
                                    <span className="surface-inset truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium text-neutral-300">
                                        {issue.label}
                                    </span>
                                )}
                            </div>
                            <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                                {identifier(issue.number)}
                            </span>
                        </div>

                        <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-neutral-100">
                            {issue.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-neutral-400">
                            {issue.description}
                        </p>

                        <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500">
                            <ClockIcon className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">
                                <span style={{ color: accent }}>{statusLabel}</span> ·{" "}
                                {GanttTimeline.issueMeta(issue, now)}
                            </span>
                        </div>

                        {isPaused && (
                            <div className="text-warning mt-2 flex items-center gap-1 text-[11px]">
                                <PausedStateIcon className="size-3 shrink-0" aria-hidden />
                                <span className="truncate">
                                    Paused {pausedMinutes}m · {issue.pauseReason}
                                </span>
                            </div>
                        )}

                        <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
                            <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                                <CommentCountIcon className="size-3" aria-hidden />
                                {issue.comments ? issue.comments : null}
                            </span>
                        </div>
                    </div>
                </div>
            </TooltipComponent>

            {isPaused && (
                <div
                    className="pointer-events-none absolute top-1/2 z-1 flex -translate-y-1/2 items-center gap-1"
                    style={{ left: left + width, width: pauseLineWidth }}
                >
                    <div className="h-px min-w-0 flex-1" style={{ background: AMBER_DASH }} />
                    <span className="shrink-0 rounded-full bg-amber-500/90 px-1.5 py-0.5 font-mono text-[10px] font-medium text-neutral-900">
                        {pausedMinutes}m
                    </span>
                </div>
            )}
        </>
    );
}
