import { RunLogEventKind, RunLogPhase } from "@trymatcha/types";

export const PHASE_LABEL: Record<RunLogPhase, string> = {
    [RunLogPhase.Boot]: "boot",
    [RunLogPhase.Clone]: "clone",
    [RunLogPhase.Install]: "install",
    [RunLogPhase.Agent]: "agent",
    [RunLogPhase.Test]: "test",
    [RunLogPhase.Push]: "push",
};

export const PHASE_COLOR: Record<RunLogPhase, string> = {
    [RunLogPhase.Boot]: "text-snow/35",
    [RunLogPhase.Clone]: "text-sky-300/60",
    [RunLogPhase.Install]: "text-amber-300/60",
    [RunLogPhase.Agent]: "text-primary/70",
    [RunLogPhase.Test]: "text-matcha/70",
    [RunLogPhase.Push]: "text-emerald-300/60",
};

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
