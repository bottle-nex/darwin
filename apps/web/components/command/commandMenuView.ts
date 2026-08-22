export interface CommandMenuViewInput {
    commandGroupCount: number;
    searchArmed: boolean;
    searchSettled: boolean;
    hasResult: boolean;
    hasHits: boolean;
    isError: boolean;
}

export interface CommandMenuView {
    showSearchGroups: boolean;
    showNoResults: boolean;
}

export function commandMenuView(input: CommandMenuViewInput): CommandMenuView {
    const searchShowsNotice =
        input.searchArmed && (!input.searchSettled || !input.hasResult || input.isError);

    return {
        showSearchGroups: input.searchArmed,
        showNoResults: !input.commandGroupCount && !input.hasHits && !searchShowsNotice,
    };
}
