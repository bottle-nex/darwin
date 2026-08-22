import { create } from "zustand";

export type IssueSelectionScope = "kanban" | "custom-kanban" | "my-issues";

interface IssueSelectionState {
    scope: IssueSelectionScope | null;
    ids: string[];
    anchorId: string | null;
    /** Ids the current shift-range contributed, so the next shift-click can take them back. */
    rangeIds: string[];
    toggle: (scope: IssueSelectionScope, id: string) => void;
    extendTo: (scope: IssueSelectionScope, id: string, ordered: string[]) => void;
    replace: (scope: IssueSelectionScope, ids: string[]) => void;
    clear: () => void;
}

const EMPTY: string[] = [];

export const useIssueSelectionStore = create<IssueSelectionState>((set, get) => ({
    scope: null,
    ids: EMPTY,
    anchorId: null,
    rangeIds: EMPTY,

    toggle: (scope, id) => {
        const current = get().scope === scope ? get().ids : EMPTY;
        const next = current.includes(id)
            ? current.filter((selected) => selected !== id)
            : [...current, id];
        set({ scope: next.length ? scope : null, ids: next, anchorId: id, rangeIds: EMPTY });
    },

    extendTo: (scope, id, ordered) => {
        const state = get();
        const current = state.scope === scope ? state.ids : EMPTY;
        const rangeIds = state.scope === scope ? state.rangeIds : EMPTY;
        const anchorId = state.anchorId ?? current[current.length - 1] ?? id;

        const from = ordered.indexOf(anchorId);
        const to = ordered.indexOf(id);
        if (from === -1 || to === -1) {
            set({ scope, ids: [id], anchorId: id, rangeIds: EMPTY });
            return;
        }

        const range = ordered.slice(Math.min(from, to), Math.max(from, to) + 1);
        const base = current.filter(
            (selected) => !rangeIds.includes(selected) || selected === anchorId,
        );
        const added = range.filter((rangeId) => !base.includes(rangeId));

        set({
            scope,
            ids: [...base, ...added],
            anchorId,
            rangeIds: added,
        });
    },

    replace: (scope, ids) =>
        set({
            scope: ids.length ? scope : null,
            ids,
            anchorId: ids[ids.length - 1] ?? null,
            rangeIds: EMPTY,
        }),

    clear: () => set({ scope: null, ids: EMPTY, anchorId: null, rangeIds: EMPTY }),
}));
