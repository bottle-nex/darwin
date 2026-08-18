import { create } from "zustand";
import type { ToastItem } from "@/types/toast.type";

const MAX_VISIBLE_PER_POSITION = 4;

interface ToastState {
    items: ToastItem[];
    push: (toast: ToastItem) => void;
    dismiss: (id: string) => void;
    clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
    items: [],
    push: (toast) =>
        set((s) => ({ items: [toast, ...s.items].slice(0, MAX_VISIBLE_PER_POSITION) })),
    dismiss: (id) => set((s) => ({ items: s.items.filter((item) => item.id !== id) })),
    clear: () => set({ items: [] }),
}));
