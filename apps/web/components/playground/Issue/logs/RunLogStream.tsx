"use client";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type RunLogEvent, RunLogEventKind, RunLogState } from "@trymatcha/types";
import { DownloadIcon, LoadingSpinnerIcon } from "@trymatcha/ui/icons";
import { useEffect, useRef, useState } from "react";

import { useRunLogs } from "@/hooks/runLogs/useRunLogs";
import { useSocketConnection } from "@/hooks/socket/useSocketConnection";
import { apiClient } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { RUN_LOGS_DOWNLOAD_URL } from "@/routes/api_routes";

import { EVENT_COLOR, EVENT_GLYPH, PHASE_COLOR, PHASE_LABEL } from "./runLog.registry";

const ROW_ESTIMATE = 18;
const TAIL_THRESHOLD_PX = 48;

function stampOf(event: RunLogEvent) {
    return new Date(event.ts).toTimeString().slice(0, 8);
}

function describe(event: RunLogEvent): string {
    switch (event.kind) {
        case RunLogEventKind.Phase:
            return PHASE_LABEL[event.phase];
        case RunLogEventKind.Thought:
            return event.durationMs < 1000
                ? "thought for <1s"
                : `thought for ${Math.round(event.durationMs / 1000)}s`;
        case RunLogEventKind.FileRead:
            return `read ${event.path}`;
        case RunLogEventKind.FileWrite:
            return `${event.mode === "edit" ? "edited" : "created"} ${event.path}`;
        case RunLogEventKind.Search:
            return `search "${event.pattern}"`;
        case RunLogEventKind.Command:
        case RunLogEventKind.CommandFailed:
            return event.command;
        case RunLogEventKind.Notice:
        case RunLogEventKind.Failure:
            return event.text;
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
    const followTail = useRef(true);

    const events = data?.events ?? [];

    const virtualizer = useVirtualizer({
        count: events.length,
        getScrollElement: () => scrollElement,
        estimateSize: () => ROW_ESTIMATE,
        overscan: 24,
    });

    useEffect(() => {
        if (!followTail.current || !events.length) return;
        virtualizer.scrollToIndex(events.length - 1, { align: "end" });
    }, [events.length, virtualizer]);

    function trackTail(event: React.UIEvent<HTMLDivElement>) {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        followTail.current = scrollHeight - scrollTop - clientHeight < TAIL_THRESHOLD_PX;
    }

    if (isLoading) {
        return (
            <div className="flex h-24 items-center justify-center">
                <LoadingSpinnerIcon className="size-4 animate-spin text-snow/40" />
            </div>
        );
    }

    if (!events.length) {
        return (
            <p className="px-3 py-6 text-center text-[12px] text-snow/35">
                {data?.state === RunLogState.Live
                    ? "Waiting for the sandbox to report..."
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
                className="no-scrollbar max-h-[420px] overflow-y-auto bg-ink/40 py-1"
            >
                <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                    {virtualizer.getVirtualItems().map((item) => {
                        const event = events[item.index];
                        return (
                            <div
                                key={event.seq}
                                ref={virtualizer.measureElement}
                                data-index={item.index}
                                className="absolute top-0 left-0 flex w-full gap-2 px-3 font-mono text-[11.5px] leading-[18px]"
                                style={{ transform: `translateY(${item.start}px)` }}
                            >
                                <span className="shrink-0 text-snow/25 tabular-nums">
                                    {stampOf(event)}
                                </span>
                                <span
                                    className={cn(
                                        "w-12 shrink-0 truncate",
                                        PHASE_COLOR[event.phase],
                                    )}
                                >
                                    {PHASE_LABEL[event.phase]}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={cn(
                                            "break-all whitespace-pre-wrap",
                                            EVENT_COLOR[event.kind],
                                        )}
                                    >
                                        <span className="mr-1.5 opacity-60">
                                            {EVENT_GLYPH[event.kind]}
                                        </span>
                                        {describe(event)}
                                    </span>
                                    {event.kind === RunLogEventKind.CommandFailed &&
                                        event.output && (
                                            <span className="mt-0.5 block border-l border-rose-300/25 pl-2 text-[11px] break-all whitespace-pre-wrap text-snow/45">
                                                {event.output}
                                            </span>
                                        )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
