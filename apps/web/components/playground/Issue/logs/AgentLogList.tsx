"use client";
import { useVirtualizer } from "@tanstack/react-virtual";
import { run_log_level, RunLogState } from "@trymatcha/types";
import { DownloadIcon, LoadingSpinnerIcon } from "@trymatcha/ui/icons";
import { useEffect, useMemo, useRef, useState } from "react";

import InfoTooltip from "@/components/ui/InfoTooltip";
import { useRunLogs } from "@/hooks/runLogs/useRunLogs";
import { useSocketConnection } from "@/hooks/socket/useSocketConnection";
import { apiClient } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { RUN_LOGS_DOWNLOAD_URL } from "@/routes/api_routes";

import { LEVEL_MESSAGE, pillFor, rowText } from "./agentLog.registry";
import { type AgentLogRow, toAgentLogRows } from "./agentLogRows";
import CopyLogButton from "./CopyLogButton";

const ROW_ESTIMATE = 25;
const TAIL_THRESHOLD_PX = 48;
const TOOLTIP_DELAY_MS = 2000;

async function openArchive(runId: string) {
    const res = await apiClient.get<{ url: string }>(RUN_LOGS_DOWNLOAD_URL(runId));
    if (res.data.url) window.open(res.data.url, "_blank", "noopener,noreferrer");
}

export default function AgentLogList({
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

    const events = useMemo(() => data?.events ?? [], [data]);
    const rows = useMemo(() => toAgentLogRows(events), [events]);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollElement,
        getItemKey: (index) => rows[index]?.key ?? index,
        estimateSize: () => ROW_ESTIMATE,
        measureElement: (element) => element.getBoundingClientRect().height,
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

    if (isLoading) {
        return (
            <div className="flex h-24 items-center justify-center">
                <LoadingSpinnerIcon className="size-4 animate-spin text-snow/40" />
            </div>
        );
    }

    if (!rows.length) {
        return (
            <p className="px-3 py-6 text-[12px] text-snow/35">
                {data?.state === RunLogState.Live
                    ? "Waiting for the agent to report..."
                    : "No logs were captured for this run."}
            </p>
        );
    }

    return (
        <div className="flex flex-col">
            {(data?.droppedEvents ?? 0) > 0 && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-snow/40">
                    <span>{data!.droppedEvents.toLocaleString()} earlier events dropped</span>
                    {canDownload && (
                        <button
                            type="button"
                            onClick={() => void openArchive(runId)}
                            className="inline-flex cursor-pointer items-center gap-1 text-snow/55 transition-colors hover:text-snow"
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
                className="no-scrollbar max-h-105 overflow-y-auto px-3 py-2"
            >
                <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                    {virtualizer.getVirtualItems().map((item) => (
                        <div
                            key={rows[item.index]!.key}
                            ref={virtualizer.measureElement}
                            data-index={item.index}
                            className="absolute top-0 left-0 w-full"
                            style={{ transform: `translateY(${item.start}px)` }}
                        >
                            <LogRow row={rows[item.index]!} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function LogRow({ row }: { row: AgentLogRow }) {
    const level = run_log_level(row.event);
    const pill = pillFor(row.event);
    const text = rowText(row.event, row.count);

    return (
        <div className="group/row flex items-center gap-2.5 py-1">
            <span
                className={cn(
                    "w-[52px] shrink-0 rounded-[4px] py-1.25 text-center text-[11px] leading-[15px] font-medium",
                    pill.className,
                )}
            >
                {pill.label}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[5px] py-1 pr-2 pl-2.5 transition-colors group-hover/row:bg-snow/3">
                <InfoTooltip
                    content={text}
                    openDelay={TOOLTIP_DELAY_MS}
                    className="max-w-md text-[12px] leading-[18px] wrap-anywhere text-snow/70"
                >
                    <span
                        className={cn(
                            "min-w-0 flex-1 truncate text-[12.5px] leading-[19px]",
                            LEVEL_MESSAGE[level] ?? "text-snow/65",
                        )}
                    >
                        {text}
                    </span>
                </InfoTooltip>
                <CopyLogButton
                    label="Copy log line"
                    text={() => text}
                    className="opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100"
                />
            </div>
        </div>
    );
}
