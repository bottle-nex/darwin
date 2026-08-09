import { create } from "zustand";
import type { Notification } from "@trymatcha/types";

const MAX_FLOATS = 3;

interface FloatNotificationsState {
    items: Notification[];
    push: (notification: Notification) => void;
    dismiss: (id: string) => void;
    clear: () => void;
}

export const useFloatNotificationsStore = create<FloatNotificationsState>((set) => ({
    items: [],
    push: (notification) =>
        set((s) =>
            s.items.some((item) => item.id === notification.id)
                ? s
                : { items: [notification, ...s.items].slice(0, MAX_FLOATS) },
        ),
    dismiss: (id) => set((s) => ({ items: s.items.filter((item) => item.id !== id) })),
    clear: () => set({ items: [] }),
}));
