"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { HiChevronDown } from "react-icons/hi2";
import { AgentSessionStatus, type AgentSession, type IssueActivity } from "@trymatcha/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { formatRelativeTime } from "@/lib/format";
import ActivityRow from "./ActivityRow";

const STATUS_TONE: Record<AgentSessionStatus, { dot: string; text: string; label: string }> = {
    [AgentSessionStatus.Running]: {
        dot: "bg-amber-400 animate-pulse",
        text: "text-amber-300",
        label: "Running",
    },
    [AgentSessionStatus.Succeeded]: {
        dot: "bg-emerald-400",
        text: "text-emerald-300",
        label: "Succeeded",
    },
    [AgentSessionStatus.Failed]: { dot: "bg-red-400", text: "text-red-300", label: "Failed" },
    [AgentSessionStatus.Aborted]: {
        dot: "bg-neutral-500",
        text: "text-neutral-400",
        label: "Aborted",
    },
};

function format_duration(ms: number): string {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** Whatever the run has settled so far — a running session has neither yet. */
function session_metrics(session: AgentSession): string[] {
    const metrics: string[] = [];
    if (session.stats?.durationMs) metrics.push(format_duration(session.stats.durationMs));
    if (session.stats?.numTurns) metrics.push(`${session.stats.numTurns} turns`);
    if (session.cost?.totalCostUsd) metrics.push(`$${session.cost.totalCostUsd.toFixed(2)}`);
    return metrics;
}

/**
 * One agent attempt, collapsed to a summary line. The session mutates for the
 * whole time the run streams, so this reads through the live row rather than
 * the frozen payloads of the activities grouped under it.
 */
export default function AgentSessionCard({
    session,
    rows,
}: {
    session: AgentSession;
    rows: IssueActivity[];
}) {
    const [expanded, setExpanded] = useState(session.status === AgentSessionStatus.Running);
    const tone = STATUS_TONE[session.status];
    const metrics = session_metrics(session);
    const startedAt = new Date(session.startedAt);

    return (
        <div className={cn("my-2 overflow-hidden rounded-lg border border-edge bg-snow/4")}>
            <Button
                variant="unstyled"
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="flex w-full cursor-pointer items-center gap-x-2.5 px-3 py-2.5 text-left transition-colors"
            >
                <span
                    aria-hidden
                    className="flex size-6 shrink-0 items-center justify-center rounded-full"
                >
                    <HeroBuddy move={false} className="size-5" />
                </span>
                <span className="min-w-0 flex-1 text-[13px] leading-5 text-neutral-500">
                    <span className="font-medium text-neutral-300">matcha</span> ran attempt{" "}
                    {session.attemptNumber}
                    <time
                        dateTime={startedAt.toISOString()}
                        title={startedAt.toLocaleString()}
                        className="ml-2 text-[11px] whitespace-nowrap text-snow/50"
                    >
                        {formatRelativeTime(startedAt)}
                    </time>
                </span>
                {metrics.length > 0 && (
                    <span className="hidden shrink-0 text-[11px] tabular-nums text-neutral-500 sm:inline">
                        {metrics.join(" · ")}
                    </span>
                )}
                <span
                    className={cn(
                        "flex shrink-0 items-center gap-x-1.5 text-[11px] font-medium",
                        tone.text,
                    )}
                >
                    <span aria-hidden className={cn("size-1.5 rounded-full", tone.dot)} />
                    {tone.label}
                </span>
                <motion.span
                    className="flex shrink-0 text-neutral-500"
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <HiChevronDown className="size-4" />
                </motion.span>
            </Button>
            {expanded && (
                <div className="border-t border-edge px-3 py-2">
                    {(session.summary || session.error) && (
                        <p
                            className={cn(
                                "mb-1.5 text-[12px] leading-5 wrap-anywhere",
                                session.error ? "text-red-300/80" : "text-neutral-400",
                            )}
                        >
                            {session.error ?? session.summary}
                        </p>
                    )}
                    <div role="list" className="flex flex-col">
                        {rows.map((row, index) => (
                            <div key={row.id} role="listitem">
                                <ActivityRow
                                    activity={row}
                                    rail={{ above: index > 0, below: index < rows.length - 1 }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
