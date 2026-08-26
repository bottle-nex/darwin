import { create } from "zustand";

import type { CommandContext } from "@/types/command.type";

interface CommandContextState extends CommandContext {
    setContext: (context: CommandContext) => void;
}

export const useCommandContextStore = create<CommandContextState>((set) => ({
    orgSlug: null,
    projectId: null,
    issueId: null,
    setContext: (context) => set(context),
}));

export function commandContext(): CommandContext {
    const { orgSlug, projectId, issueId } = useCommandContextStore.getState();
    return { orgSlug, projectId, issueId };
}
