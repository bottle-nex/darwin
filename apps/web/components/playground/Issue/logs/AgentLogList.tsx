"use client";
import { useVirtualizer } from "@tanstack/react-virtual";
import { run_log_level, type RunLogEvent, RunLogEventKind, RunLogState } from "@trydarwin/types";
import { DownloadIcon, DropdownCaretIcon, LoadingSpinnerIcon } from "@trydarwin/ui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnswerQuestion, useIssueQuestions } from "@/hooks/connectors/useIssueQuestions";
import { useRunLogs } from "@/hooks/runLogs/useRunLogs";
import { useSocketConnection } from "@/hooks/socket/useSocketConnection";
import { apiClient } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { RUN_LOGS_DOWNLOAD_URL } from "@/routes/api_routes";

import { detailOf, ICON, LEVEL_MESSAGE, titleOf } from "./agentLog.registry";
import AgentLogDetail from "./AgentLogDetail";
import { toAgentLogRows } from "./agentLogRows";
import CopyLogButton from "./CopyLogButton";

const ROW_ESTIMATE = 30;
const TAIL_THRESHOLD_PX = 48;
const DETAIL_SPRING = { type: "spring", stiffness: 520, damping: 40, mass: 0.5 } as const;

async function openArchive(runId: string) {
    const res = await apiClient.get<{ url: string }>(RUN_LOGS_DOWNLOAD_URL(runId));
    if (res.data.url) window.open(res.data.url, "_blank", "noopener,noreferrer");
}

export default function AgentLogList({
    runId,
    projectId,
    issueId,
    canDownload,
}: {
    runId: string;
    projectId: string;
    issueId?: string;
    canDownload: boolean;
}) {
    "use no memo";

    const isConnected = useSocketConnection(projectId);
    const { data, isLoading } = useRunLogs(runId, isConnected);
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const [opened, setOpened] = useState<ReadonlySet<number>>(() => new Set());
    const followTail = useRef(true);

    const { data: pendingQuestions } = useIssueQuestions(issueId);
    const answer = useAnswerQuestion(issueId ?? "");

    // A question the agent is still blocked on is answerable right where it was asked; once it
    // is answered the same row becomes plain history, and the answer arrives as its own event.
    const waiting = useMemo(
        () => new Set((pendingQuestions ?? []).map((question) => question.id)),
        [pendingQuestions],
    );

    const events = useMemo(() => data?.events ?? [], [data]);
    const rows = useMemo(() => toAgentLogRows(events), [events]);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollElement,
        getItemKey: (index) => rows[index]?.seq ?? index,
        estimateSize: () => ROW_ESTIMATE,
        measureElement: (element) => element.getBoundingClientRect().height,
        overscan: 12,
    });

    useEffect(() => {
        if (!followTail.current || !rows.length) return;
        virtualizer.scrollToIndex(rows.length - 1, { align: "end" });
    }, [rows.length, virtualizer]);

    function trackTail(event: React.UIEvent<HTMLDivElement>) {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        followTail.current = scrollHeight - scrollTop - clientHeight < TAIL_THRESHOLD_PX;
    }

    function toggle(seq: number) {
        setOpened((previous) => {
            const next = new Set(previous);
            if (next.has(seq)) next.delete(seq);
            else next.add(seq);
            return next;
        });
    }

    if (isLoading) {
        return (
            <div className="flex h-24 items-center justify-center">
                <LoadingSpinnerIcon className="size-4 animate-spin text-overlay/40" />
            </div>
        );
    }

    if (!rows.length) {
        return (
            <p className="px-3 py-6 text-[12px] text-overlay/35">
                {data?.state === RunLogState.Live
                    ? "Waiting for the agent to report..."
                    : "No logs were captured for this run."}
            </p>
        );
    }

    return (
        <div className="flex flex-col">
            {(data?.droppedEvents ?? 0) > 0 && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-overlay/40">
                    <span>{data!.droppedEvents.toLocaleString()} earlier events dropped</span>
                    {canDownload && (
                        <button
                            type="button"
                            onClick={() => void openArchive(runId)}
                            className="inline-flex cursor-pointer items-center gap-1 text-overlay/55 transition-colors hover:text-overlay"
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
                className="no-scrollbar max-h-[560px] overflow-y-auto px-3 py-1.5"
            >
                <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                    {virtualizer.getVirtualItems().map((item) => (
                        <div
                            key={rows[item.index]!.seq}
                            ref={virtualizer.measureElement}
                            data-index={item.index}
                            className="absolute top-0 left-0 w-full"
                            style={{ transform: `translateY(${item.start}px)` }}
                        >
                            <LogRow
                                event={rows[item.index]!}
                                open={opened.has(rows[item.index]!.seq)}
                                onToggle={toggle}
                                railed={item.index < rows.length - 1}
                                waiting={waiting}
                                busy={answer.isPending}
                                onAnswer={(questionId, value) =>
                                    answer.mutate(
                                        { questionId, value },
                                        {
                                            onSuccess: () => toast.success("Sent to the agent"),
                                            onError: () => toast.error("Could not send that"),
                                        },
                                    )
                                }
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function LogRow({
    event,
    open,
    onToggle,
    railed,
    waiting,
    busy,
    onAnswer,
}: {
    event: RunLogEvent;
    open: boolean;
    onToggle: (seq: number) => void;
    railed: boolean;
    waiting: ReadonlySet<string>;
    busy: boolean;
    onAnswer: (questionId: string, value: string) => void;
}) {
    const Icon = ICON[event.kind];
    const title = titleOf(event);
    const detail = detailOf(event);
    const tone = LEVEL_MESSAGE[run_log_level(event)] ?? "text-overlay/60";

    return (
        <div className="group/row relative flex items-start gap-x-2.5 pb-2">
            {railed && (
                <span
                    aria-hidden
                    className="absolute top-[22px] bottom-0 left-[11px] w-px bg-overlay/10"
                />
            )}
            <span
                aria-hidden
                className="relative z-10 flex size-[22px] shrink-0 items-center justify-center"
            >
                <Icon className="size-3.5 text-overlay/45" />
            </span>

            <div className="min-w-0 flex-1">
                <div className="flex h-[22px] items-center gap-1.5">
                    {detail ? (
                        <button
                            type="button"
                            onClick={() => onToggle(event.seq)}
                            aria-expanded={open}
                            className="flex min-w-0 cursor-pointer items-center gap-1.5 text-left"
                        >
                            <span
                                className={cn(
                                    "truncate text-[13px] leading-[22px] hover:text-overlay/80 transition-colors duration-200",
                                    tone,
                                )}
                            >
                                {title}
                            </span>
                            <DropdownCaretIcon
                                className={cn(
                                    "size-3.5 shrink-0 text-overlay/30 transition-transform",
                                    !open && "-rotate-90",
                                )}
                                aria-hidden
                            />
                        </button>
                    ) : (
                        <span
                            className={cn(
                                "min-w-0 truncate text-[13px] leading-[22px] transition-colors duration-300",
                                tone,
                            )}
                        >
                            {title}
                        </span>
                    )}
                    <CopyLogButton
                        label="Copy log line"
                        text={() => title}
                        className="opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100"
                    />
                </div>
                <AnimatePresence initial={false}>
                    {detail && open && (
                        <motion.div
                            key="detail"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={DETAIL_SPRING}
                            className="overflow-hidden"
                        >
                            <AgentLogDetail detail={detail} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {event.kind === RunLogEventKind.QuestionAsked && waiting.has(event.questionId) && (
                    <QuestionReply
                        options={event.options ?? []}
                        busy={busy}
                        onAnswer={(value) => onAnswer(event.questionId, value)}
                    />
                )}
            </div>
        </div>
    );
}

/**
 * The answer control, rendered in the run's timeline at the point the question was asked, so the
 * exchange reads in the order it happened rather than sitting in a panel away from its context.
 */
function QuestionReply({
    options,
    busy,
    onAnswer,
}: {
    options: string[];
    busy: boolean;
    onAnswer: (value: string) => void;
}) {
    const [text, setText] = useState("");

    return (
        <div className="mt-1.5 mb-1 flex flex-col gap-2 rounded-lg border border-warning-edge bg-warning-surface p-2.5">
            {options.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {options.map((option) => (
                        <Button
                            key={option}
                            type="button"
                            variant="flat"
                            size="xs"
                            disabled={busy}
                            onClick={() => onAnswer(option)}
                        >
                            {option}
                        </Button>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-1.5">
                    <Input
                        variant="outline"
                        className="h-7 text-[12px]"
                        placeholder="Answer the agent"
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && text.trim()) onAnswer(text.trim());
                        }}
                    />
                    <Button
                        type="button"
                        variant="flat-primary"
                        size="xs"
                        className="shrink-0"
                        disabled={busy || !text.trim()}
                        onClick={() => onAnswer(text.trim())}
                    >
                        Send
                    </Button>
                </div>
            )}
        </div>
    );
}
