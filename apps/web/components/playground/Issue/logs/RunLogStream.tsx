"use client";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type RunLogEvent, RunLogEventKind, RunLogState } from "@trymatcha/types";
import { DownloadIcon, DropdownCaretIcon, LoadingSpinnerIcon } from "@trymatcha/ui/icons";
import { useEffect, useMemo, useRef, useState } from "react";

import { useRunLogs } from "@/hooks/runLogs/useRunLogs";
import { useSocketConnection } from "@/hooks/socket/useSocketConnection";
import { apiClient } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { RUN_LOGS_DOWNLOAD_URL } from "@/routes/api_routes";

import { EVENT_COLOR, EVENT_GLYPH, GROUP_LABEL } from "./runLog.registry";
import { groupRunLogEvents, type RunLogRow, toRunLogRows } from "./runLogGroups";

const ROW_ESTIMATE = 20;
const TAIL_THRESHOLD_PX = 48;

function describe(event: RunLogEvent): string {
    switch (event.kind) {
        case RunLogEventKind.Phase:
            return event.phase;
        case RunLogEventKind.Thought:
            return event.durationMs < 1000
                ? "Thought for less than a second"
                : `Thought for ${Math.round(event.durationMs / 1000)}s`;
        case RunLogEventKind.FileRead:
            return `Read ${event.path}`;
        case RunLogEventKind.FileWrite:
            return `${event.mode === "edit" ? "Edited" : "Created"} ${event.path}`;
        case RunLogEventKind.Search:
            return `Searched for "${event.pattern}"`;
        case RunLogEventKind.Command:
        case RunLogEventKind.CommandFailed:
            return event.command;
        case RunLogEventKind.Notice:
        case RunLogEventKind.Failure:
            return event.text;
    }
}

function detail(event: RunLogEvent): string {
    switch (event.kind) {
        case RunLogEventKind.FileRead:
        case RunLogEventKind.FileWrite:
            return event.path;
        case RunLogEventKind.Search:
            return event.pattern;
        case RunLogEventKind.Command:
        case RunLogEventKind.CommandFailed:
            return event.command;
        default:
            return describe(event);
    }
}

async function openArchive(runId: string) {
    const res = await apiClient.get<{ url: string }>(RUN_LOGS_DOWNLOAD_URL(runId));
    if (res.data.url) window.open(res.data.url, "_blank", "noopener,noreferrer");
}

export default function RunLogStream({
    runId,
    projectId,
    canDownload,
}: {
    runId: string;
    projectId: string;
    canDownload: boolean;
}) {
    "use no memo";

    const isConnected = useSocketConnection(projectId);
    const { data, isLoading } = useRunLogs(runId, isConnected);
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
    const followTail = useRef(true);

    const events = data?.events ?? [];
    const rows = useMemo(
        () => toRunLogRows(groupRunLogEvents(events), collapsed),
        [events, collapsed],
    );

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollElement,
        estimateSize: () => ROW_ESTIMATE,
        overscan: 24,
    });

    useEffect(() => {
        if (!followTail.current || !rows.length) return;
        virtualizer.scrollToIndex(rows.length - 1, { align: "end" });
    }, [rows.length, virtualizer]);

    function trackTail(event: React.UIEvent<HTMLDivElement>) {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        followTail.current = scrollHeight - scrollTop - clientHeight < TAIL_THRESHOLD_PX;
    }

    function toggleGroup(key: string) {
        setCollapsed((previous) => {
            const next = new Set(previous);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    if (isLoading) {
        return (
            <div className="flex h-24 items-center justify-center">
                <LoadingSpinnerIcon className="size-4 animate-spin text-snow/40" />
            </div>
        );
    }

    if (!rows.length) {
        return (
            <p className="px-3 py-6 text-center text-[12px] text-snow/35">
                {data?.state === RunLogState.Live
                    ? "Waiting for the agent to report..."
                    : "No logs were captured for this run."}
            </p>
        );
    }

    return (
        <div className="flex flex-col">
            {(data?.droppedEvents ?? 0) > 0 && (
                <div className="flex items-center justify-between gap-2 border-b border-edge px-3 py-1.5 text-[11px] text-snow/40">
                    <span>{data!.droppedEvents.toLocaleString()} earlier events dropped</span>
                    {canDownload && (
                        <button
                            type="button"
                            onClick={() => void openArchive(runId)}
                            className="inline-flex items-center gap-1 text-snow/55 transition-colors hover:text-snow"
                        >
                            <DownloadIcon className="size-3" />
                            full log
                        </button>
                    )}
                </div>
            )}

            <div
                ref={setScrollElement}
                onScroll={trackTail}
                data-lenis-prevent
                className="no-scrollbar max-h-[420px] overflow-y-auto py-1.5"
            >
                <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                    {virtualizer.getVirtualItems().map((item) => (
                        <div
                            key={rows[item.index]!.key}
                            ref={virtualizer.measureElement}
                            data-index={item.index}
                            className="absolute top-0 left-0 w-full px-3"
                            style={{ transform: `translateY(${item.start}px)` }}
                        >
                            <RunLogRowView row={rows[item.index]!} onToggle={toggleGroup} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function RunLogRowView({ row, onToggle }: { row: RunLogRow; onToggle: (key: string) => void }) {
    if (row.type === "header") {
        const label = GROUP_LABEL[row.group.kind]?.(row.group.events.length);
        return (
            <button
                type="button"
                onClick={() => onToggle(row.key)}
                aria-expanded={row.expanded}
                className="flex w-full items-center gap-1.5 py-[3px] text-left text-[12.5px] text-snow/70 transition-colors hover:text-snow"
            >
                <DropdownCaretIcon
                    className={cn(
                        "size-2.5 shrink-0 text-neutral-500 transition-transform",
                        !row.expanded && "-rotate-90",
                    )}
                    aria-hidden
                />
                <span className="truncate">{label}</span>
            </button>
        );
    }

    if (row.type === "child") {
        return (
            <div className="flex items-start gap-2 py-[2px] pl-[13px]">
                <span aria-hidden className="w-px shrink-0 self-stretch bg-snow/12" />
                <span className="min-w-0 flex-1 truncate pl-2 font-mono text-[11.5px] leading-[18px] text-snow/45">
                    {detail(row.event)}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-1.5 py-[3px]">
            <span
                aria-hidden
                className={cn(
                    "w-3 shrink-0 text-center text-[11px] leading-[19px]",
                    EVENT_COLOR[row.event.kind],
                )}
            >
                {EVENT_GLYPH[row.event.kind]}
            </span>
            <span
                className={cn(
                    "min-w-0 flex-1 text-[12.5px] leading-[19px] break-words",
                    EVENT_COLOR[row.event.kind],
                )}
            >
                {describe(row.event)}
                {row.event.kind === RunLogEventKind.CommandFailed && row.event.output && (
                    <span className="mt-1 block border-l border-rose-300/25 pl-2 font-mono text-[11px] break-all whitespace-pre-wrap text-snow/45">
                        {row.event.output}
                    </span>
                )}
            </span>
        </div>
    );
}
