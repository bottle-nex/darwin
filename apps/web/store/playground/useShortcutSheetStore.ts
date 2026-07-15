import { create } from "zustand";

interface ShortcutSheetState {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    setOpen: (isOpen: boolean) => void;
}

export const useShortcutSheetStore = create<ShortcutSheetState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    setOpen: (isOpen) => set({ isOpen }),
}));
