import { type RunLogEvent, RunLogEventKind, RunLogLevel } from "@trydarwin/types";
import {
    AgentStepIcon,
    ChangedFilesIcon,
    CheckIcon,
    CommandIcon,
    CommitsIcon,
    EditIcon,
    ErrorCircleIcon,
    FileIcon,
    type IconType,
    PullRequestOpenIcon,
    SearchIcon,
    StatusInfoIcon,
} from "@trydarwin/ui/icons";

export const ICON: Record<RunLogEventKind, IconType> = {
    [RunLogEventKind.Step]: AgentStepIcon,
    [RunLogEventKind.Command]: CommandIcon,
    [RunLogEventKind.FileRead]: FileIcon,
    [RunLogEventKind.FileWrite]: EditIcon,
    [RunLogEventKind.Search]: SearchIcon,
    [RunLogEventKind.Committed]: CommitsIcon,
    [RunLogEventKind.PullRequestOpened]: PullRequestOpenIcon,
    [RunLogEventKind.Notice]: StatusInfoIcon,
    [RunLogEventKind.ChangesSummary]: ChangedFilesIcon,
    [RunLogEventKind.AgentFinished]: CheckIcon,
    [RunLogEventKind.RunFailed]: ErrorCircleIcon,
};

/** Info reads at the row's own weight; a warn or error tints the title it belongs to. */
export const LEVEL_MESSAGE: Partial<Record<RunLogLevel, string>> = {
    [RunLogLevel.Warn]: "text-amber-200/75 hover:text-amber-200/90",
    [RunLogLevel.Error]: "text-rose-300/85 hover:text-rose-300/90",
};

export type LogDetail = {
    input?: { label: string; text: string };
    output?: { label: string; text: string };
};

/** What a row opens to, or null when it has nothing behind it and gets no chevron. */
export function detailOf(event: RunLogEvent): LogDetail | null {
    if (event.kind === RunLogEventKind.Command) {
        if (!event.output) return { input: { label: "bash", text: event.command } };
        return {
            input: { label: "bash", text: event.command },
            output: { label: "Output", text: event.output },
        };
    }
    if (event.kind === RunLogEventKind.Committed && event.body) {
        return { output: { label: "Message", text: event.body } };
    }
    return null;
}

function duration(ms: number): string {
    if (ms < 1000) return "under a second";
    const total = Math.round(ms / 1000);
    if (total < 60) return `${total}s`;
    return `${Math.floor(total / 60)}m ${total % 60}s`;
}

export function titleOf(event: RunLogEvent): string {
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
            return `Read ${event.path}`;
        case RunLogEventKind.FileWrite:
            return `${event.mode === "edit" ? "Edited" : "Created"} ${event.path}`;
        case RunLogEventKind.Search:
            return `Searched "${event.pattern}"`;
        case RunLogEventKind.Command:
            return event.title || event.command;
        case RunLogEventKind.Committed:
            return event.subject;
        case RunLogEventKind.PullRequestOpened:
            return `Opened pull request #${event.number}`;
    }
}
