import { type RunLogEvent, RunLogEventKind, RunLogLevel } from "@trymatcha/types";

export type Pill = { label: string; className: string };

const VOICE = "bg-[#1B2027] text-[#D6DEE9]"; // neutral, highest contrast — the main speaking line
const ASIDE = "bg-[#1A1E2B] text-[#A9B4CC]"; // cooler, one step down — secondary commentary
const LOOKING = "bg-[#0F2438] text-[#5FB8F7]"; // blue — reading / searching
const CHANGE = "bg-[#132D21] text-[#3FD78D]"; // unchanged
const OUTCOME = "bg-[#1F1B33] text-[#A794FF]"; // violet — final result
const WARN = "bg-[#2C2411] text-[#F2B441]"; // amber
const ERROR = "bg-[#2E161B] text-[#FF7B87]"; // rose

/** The pill names what a row is; {@link LEVEL_MESSAGE} says how badly it went. */
export function pillFor(event: RunLogEvent): Pill {
    switch (event.kind) {
        case RunLogEventKind.Step:
            return { label: "Step", className: VOICE };
        case RunLogEventKind.FileWrite:
            return {
                label: event.mode === "edit" ? "Edit" : "New",
                className: CHANGE,
            };
        case RunLogEventKind.FileRead:
            return { label: "Read", className: LOOKING };
        case RunLogEventKind.Search:
            return { label: "Find", className: LOOKING };
        case RunLogEventKind.CommandFailed:
            return { label: "Failed", className: WARN };
        case RunLogEventKind.RunFailed:
            return { label: "Failed", className: ERROR };
        case RunLogEventKind.Notice:
            return { label: "Note", className: ASIDE };
        case RunLogEventKind.AgentFinished:
            return { label: "Done", className: OUTCOME };
        case RunLogEventKind.ChangesSummary:
            return { label: "Diff", className: OUTCOME };
    }
}

/** Info reads at the row's own weight; a warn or error tints the message it belongs to. */
export const LEVEL_MESSAGE: Partial<Record<RunLogLevel, string>> = {
    [RunLogLevel.Warn]: "text-amber-200/75",
    [RunLogLevel.Error]: "text-rose-300/85",
};

function duration(ms: number): string {
    if (ms < 1000) return "under a second";
    const total = Math.round(ms / 1000);
    if (total < 60) return `${total}s`;
    return `${Math.floor(total / 60)}m ${total % 60}s`;
}

export function rowText(event: RunLogEvent, count: number): string {
    return count > 1 ? describeRepeat(event, count) : describeEvent(event);
}

function describeEvent(event: RunLogEvent): string {
    switch (event.kind) {
        case RunLogEventKind.AgentFinished:
            return `Agent finished in ${duration(event.durationMs)}`;
        case RunLogEventKind.ChangesSummary:
            return `Changed ${event.files} ${event.files === 1 ? "file" : "files"} (+${event.insertions} −${event.deletions})`;
        case RunLogEventKind.RunFailed:
            return `Run failed — ${event.reason}`;
        case RunLogEventKind.Step:
        case RunLogEventKind.Notice:
            return event.text;
        case RunLogEventKind.FileRead:
        case RunLogEventKind.FileWrite:
            return event.path;
        case RunLogEventKind.Search:
            return `"${event.pattern}"`;
        case RunLogEventKind.CommandFailed:
            return `${event.command}${event.exitCode === undefined ? "" : ` (exit ${event.exitCode})`}`;
    }
}

function describeRepeat(event: RunLogEvent, count: number): string {
    switch (event.kind) {
        case RunLogEventKind.FileRead:
            return `${count} files`;
        case RunLogEventKind.FileWrite:
            return `${count} files`;
        case RunLogEventKind.Search:
            return `${count} searches`;
        default:
            return describeEvent(event);
    }
}
