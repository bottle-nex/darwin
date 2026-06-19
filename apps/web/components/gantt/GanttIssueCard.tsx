import { MdAccessTimeFilled, MdChat, MdPause } from "react-icons/md";
import { cn } from "@/lib/utils";
import { barGeometry, issueMeta, MINUTE_WIDTH, PRIORITY_DOT, type GanttIssue } from "./types";

/**
 * An issue card in a worker lane, positioned by time and sized to its duration.
 * Reads by status via a coloured strip, border, and label: queued (violet),
 * solving (blue), paused (amber), done (green). Read-only.
 */
export default function GanttIssueCard({ issue, now }: { issue: GanttIssue; now: number }) {
    const { left, width } = barGeometry(issue, now);
    const isSolving = issue.status === "solving";
    const isQueued = issue.status === "queued";
    const isDone = issue.status === "done";
    const isPaused = isSolving && issue.pausedAt != null;

    const accent = isPaused ? "#fbbf24" : isDone ? "#4ade80" : isSolving ? "#60a5fa" : "#a78bfa";
    const statusLabel = isPaused
        ? "Paused"
        : isDone
          ? "Done"
          : isSolving
            ? "In progress"
            : "Queued";

    // Paused: a live amber line extends from the frozen bar to "now", counter ticking up.
    const pausedMinutes = isPaused ? Math.max(0, Math.round(now - issue.pausedAt!)) : 0;
    const pauseLineWidth = isPaused ? Math.max(0, (now - issue.pausedAt!) * MINUTE_WIDTH) : 0;
    const AMBER_DASH = "repeating-linear-gradient(to right, #f59e0b 0 4px, transparent 4px 8px)";

    return (
        <>
            <div
                className={cn(
                    "absolute inset-y-2 z-1 overflow-hidden rounded-md border bg-neutral-800 shadow-sm",
                    isQueued && "border-dashed opacity-70",
                    isDone && "opacity-90",
                )}
                style={{
                    left,
                    width,
                    borderColor: accent + (isQueued ? "40" : "59"),
                    boxShadow:
                        isSolving && !isPaused ? "0 0 14px rgba(255,255,255,0.06)" : undefined,
                }}
                title={`${issue.number} · ${issue.title}`}
            >
                <span className="absolute inset-y-0 left-0 w-0.75" style={{ background: accent }} />

                <div className="flex h-full flex-col py-2.5 pl-3 pr-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <span
                                className={cn(
                                    "size-1.5 shrink-0 rounded-full",
                                    isSolving && !isPaused && "animate-pulse",
                                    PRIORITY_DOT[issue.priority],
                                )}
                            />
                            {issue.label && (
                                <span className="truncate rounded-md bg-neutral-700 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300">
                                    {issue.label}
                                </span>
                            )}
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                            {issue.number}
                        </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-neutral-100">
                        {issue.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-neutral-400">
                        {issue.description}
                    </p>

                    <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500">
                        <MdAccessTimeFilled className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">
                            <span style={{ color: accent }}>{statusLabel}</span> ·{" "}
                            {issueMeta(issue, now)}
                        </span>
                    </div>

                    {isPaused && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-400">
                            <MdPause className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">
                                Paused {pausedMinutes}m · {issue.pauseReason}
                            </span>
                        </div>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-neutral-700 pt-2">
                        <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                            <MdChat className="size-3" aria-hidden />
                            {issue.comments ? issue.comments : null}
                        </span>
                        {issue.agent && (
                            <span
                                className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                                style={{ background: "#D97757" }}
                            >
                                <span className="size-1.5 rounded-full bg-white/90" />
                                {issue.agent}
                            </span>
                        )}
                    </div>
                </div>
            </div>

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
