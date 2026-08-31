import { RunLogEventKind } from "@trymatcha/types";

export const EVENT_GLYPH: Record<RunLogEventKind, string> = {
    [RunLogEventKind.Phase]: "──",
    [RunLogEventKind.Thought]: "✻",
    [RunLogEventKind.FileRead]: "⟩",
    [RunLogEventKind.FileWrite]: "⟩",
    [RunLogEventKind.Search]: "⟩",
    [RunLogEventKind.Command]: "$",
    [RunLogEventKind.CommandFailed]: "✗",
    [RunLogEventKind.Notice]: "▪",
    [RunLogEventKind.Failure]: "✗",
};

export const EVENT_COLOR: Record<RunLogEventKind, string> = {
    [RunLogEventKind.Phase]: "text-snow/35",
    [RunLogEventKind.Thought]: "text-violet-300/60 italic",
    [RunLogEventKind.FileRead]: "text-sky-300/70",
    [RunLogEventKind.FileWrite]: "text-matcha/80",
    [RunLogEventKind.Search]: "text-sky-300/60",
    [RunLogEventKind.Command]: "text-snow/75",
    [RunLogEventKind.CommandFailed]: "text-rose-300/85",
    [RunLogEventKind.Notice]: "text-snow/55",
    [RunLogEventKind.Failure]: "text-rose-300/85",
};

export const GROUP_LABEL: Partial<Record<RunLogEventKind, (count: number) => string>> = {
    [RunLogEventKind.FileRead]: (count) => `Read ${count} files`,
    [RunLogEventKind.FileWrite]: (count) => `Changed ${count} files`,
    [RunLogEventKind.Search]: (count) => `Ran ${count} searches`,
    [RunLogEventKind.Command]: (count) => `Ran ${count} commands`,
};
