import { create } from "zustand";

interface MemberSelectionState {
    ids: string[];
    anchorId: string | null;
    /** Ids the current shift-range contributed, so the next shift-click can take them back. */
    rangeIds: string[];
    toggle: (id: string) => void;
    extendTo: (id: string, ordered: string[]) => void;
    replace: (ids: string[]) => void;
    clear: () => void;
}

const EMPTY: string[] = [];

export const useMemberSelectionStore = create<MemberSelectionState>((set, get) => ({
    ids: EMPTY,
    anchorId: null,
    rangeIds: EMPTY,

    toggle: (id) => {
        const current = get().ids;
        const next = current.includes(id)
            ? current.filter((selected) => selected !== id)
            : [...current, id];
        set({ ids: next, anchorId: id, rangeIds: EMPTY });
    },

    extendTo: (id, ordered) => {
        const state = get();
        const anchorId = state.anchorId ?? state.ids[state.ids.length - 1] ?? id;

        const from = ordered.indexOf(anchorId);
        const to = ordered.indexOf(id);
        if (from === -1 || to === -1) {
            set({ ids: [id], anchorId: id, rangeIds: EMPTY });
            return;
        }

        const range = ordered.slice(Math.min(from, to), Math.max(from, to) + 1);
        const base = state.ids.filter(
            (selected) => !state.rangeIds.includes(selected) || selected === anchorId,
        );
        const added = range.filter((rangeId) => !base.includes(rangeId));

        set({ ids: [...base, ...added], anchorId, rangeIds: added });
    },

    replace: (ids) => set({ ids, anchorId: ids[ids.length - 1] ?? null, rangeIds: EMPTY }),

    clear: () => set({ ids: EMPTY, anchorId: null, rangeIds: EMPTY }),
}));
