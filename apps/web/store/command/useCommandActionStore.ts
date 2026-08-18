import { create } from "zustand";

export type CommandActionId =
    | "new-tag"
    | "new-organization"
    | "switch-organization"
    | "switch-project"
    | "switch-team"
    | "delete-team"
    | "delete-tag"
    | "delete-project";

interface CommandActionState {
    pending: CommandActionId | null;
    start: (id: CommandActionId) => void;
    clear: () => void;
}

export const useCommandActionStore = create<CommandActionState>((set) => ({
    pending: null,
    start: (pending) => set({ pending }),
    clear: () => set({ pending: null }),
}));
