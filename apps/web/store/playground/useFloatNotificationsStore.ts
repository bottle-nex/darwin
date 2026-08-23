import { create } from "zustand";
import { notification_scope, type Notification, type NotificationScope } from "@trymatcha/types";

const MAX_FLOATS = 3;

interface FloatNotificationsState {
    items: Notification[];
    push: (notification: Notification) => void;
    dismiss: (id: string) => void;
    clearScope: (scope: NotificationScope, projectId?: string | null) => void;
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
    clearScope: (scope, projectId) =>
        set((s) => ({
            items: s.items.filter(
                (item) =>
                    notification_scope(item.type) !== scope ||
                    (projectId !== undefined && item.projectId !== projectId),
            ),
        })),
}));
