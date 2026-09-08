import {
    ISSUE_LANE_NAME,
    run_log_level,
    type RunLogEvent,
    RunLogEventKind,
    RunLogPhase,
} from "@trydarwin/types";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { ICON, LEVEL_MESSAGE, titleOf } from "@/components/playground/Issue/logs/agentLog.registry";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import { KanbanStatus } from "@/types/kanban";

const RUN: RunLogEvent[] = [
    {
        seq: 1,
        ts: "2026-03-04T09:15:11.000Z",
        phase: RunLogPhase.Agent,
        kind: RunLogEventKind.FileWrite,
        path: "apps/server/src/services/service.otp.ts",
        mode: "edit",
    },
    {
        seq: 2,
        ts: "2026-03-04T09:16:03.000Z",
        phase: RunLogPhase.Agent,
        kind: RunLogEventKind.Command,
        command: "bun run typecheck",
        title: "bun run typecheck",
    },
    {
        seq: 3,
        ts: "2026-03-04T09:16:44.000Z",
        phase: RunLogPhase.Publish,
        kind: RunLogEventKind.ChangesSummary,
        files: 2,
        insertions: 42,
        deletions: 11,
    },
    {
        seq: 4,
        ts: "2026-03-04T09:17:09.000Z",
        phase: RunLogPhase.Publish,
        kind: RunLogEventKind.PullRequestOpened,
        number: 142,
        url: "#",
    },
];

type Row = { kind: "event"; event: RunLogEvent } | { kind: "status"; status: KanbanStatus };

const NEUTRAL_STATUS_TINT: Partial<Record<KanbanStatus, string>> = {
    [KanbanStatus.Todo]: "text-foreground/85",
    [KanbanStatus.Queued]: "text-foreground/55",
};

const ICON_TINT: Partial<Record<RunLogEventKind, string>> = {
    [RunLogEventKind.PullRequestOpened]: "text-green-500",
    [RunLogEventKind.AgentFinished]: "text-green-500",
    [RunLogEventKind.Committed]: "text-primary",
    [RunLogEventKind.RunFailed]: "text-rose-500",
};

function eventTitle(event: RunLogEvent) {
    if (event.kind !== RunLogEventKind.ChangesSummary) return titleOf(event);
    return (
        <>
            Changed {event.files} {event.files === 1 ? "file" : "files"} (
            <span className="text-green-500">+{event.insertions}</span>{" "}
            <span className="text-rose-500">−{event.deletions}</span>)
        </>
    );
}

const ROWS: Row[] = [
    { kind: "status", status: KanbanStatus.Todo },
    { kind: "status", status: KanbanStatus.Queued },
    { kind: "status", status: KanbanStatus.InProgress },
    ...RUN.map((event): Row => ({ kind: "event", event })),
];

export default function HeroAgentRun({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "w-[17rem] rounded-t-lg border border-edge bg-snow shadow-[0_14px_30px_-16px_rgba(24,24,27,0.28)] [mask-image:linear-gradient(to_bottom,#000_82%,#000c_89%,#0006_95%,#0000_100%)]",
                className,
            )}
        >
            <div className="flex items-center gap-2 border-b border-edge px-2.5 py-1.5">
                <HeroBuddy move={false} className="size-3.5 shrink-0" />
                <span className="text-[11px] font-medium text-muted-foreground">Agent logs</span>
            </div>

            <div className="px-2 py-1">
                {ROWS.map((row, index) => {
                    const status = row.kind === "status" ? KanbanBoard.columnFor(row.status) : null;
                    const Icon = row.kind === "status" ? status?.icon : ICON[row.event.kind];
                    const tone =
                        row.kind === "status"
                            ? (NEUTRAL_STATUS_TINT[row.status] ??
                              status?.titleBox ??
                              "text-foreground/60")
                            : (LEVEL_MESSAGE[run_log_level(row.event)] ?? "text-foreground/60");
                    const glyphTone =
                        row.kind === "status"
                            ? tone
                            : (ICON_TINT[row.event.kind] ?? "text-foreground/45");
                    const title =
                        row.kind === "status"
                            ? `Moved to ${ISSUE_LANE_NAME[row.status]}`
                            : eventTitle(row.event);

                    return (
                        <div
                            key={row.kind === "status" ? `status-${row.status}` : row.event.seq}
                            className="relative flex items-start gap-x-2 pb-1.5"
                        >
                            {index < ROWS.length - 1 && (
                                <span
                                    aria-hidden
                                    className="absolute top-[20px] bottom-0 left-[10px] w-px bg-foreground/10"
                                />
                            )}
                            <span
                                aria-hidden
                                className="relative z-10 flex size-[20px] shrink-0 items-center justify-center"
                            >
                                {Icon && <Icon className={cn("size-3.25", glyphTone)} />}
                            </span>

                            <span
                                className={cn(
                                    "min-w-0 flex-1 truncate text-[11.5px] leading-[20px]",
                                    tone,
                                )}
                            >
                                {title}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
