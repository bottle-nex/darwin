import { create } from "zustand";

interface IssueChatPanelState {
    isOpen: boolean;
    toggle: () => void;
}

export const useIssueChatPanelStore = create<IssueChatPanelState>((set) => ({
    isOpen: false,
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
