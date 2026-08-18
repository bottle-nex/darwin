import { create } from "zustand";
import type { CommandPage } from "@/types/command.type";

interface CommandMenuState {
    isOpen: boolean;
    page: CommandPage | null;
    open: () => void;
    openAt: (page: CommandPage) => void;
    setPage: (page: CommandPage | null) => void;
    close: () => void;
    toggle: () => void;
    setOpen: (isOpen: boolean) => void;
}

export const useCommandMenuStore = create<CommandMenuState>((set) => ({
    isOpen: false,
    page: null,
    open: () => set({ isOpen: true, page: null }),
    openAt: (page) => set({ isOpen: true, page }),
    setPage: (page) => set({ page }),
    close: () => set({ isOpen: false, page: null }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen, page: null })),
    setOpen: (isOpen) => set({ isOpen, page: null }),
}));
