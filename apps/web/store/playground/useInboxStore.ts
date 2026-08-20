import { create } from "zustand";

export type InboxFilter = "all" | "unread";

interface InboxState {
    selectedId: string | null;
    filter: InboxFilter;
    select: (notificationId: string | null) => void;
    setFilter: (filter: InboxFilter) => void;
}

export const useInboxStore = create<InboxState>((set) => ({
    selectedId: null,
    filter: "all",
    select: (notificationId) => set({ selectedId: notificationId }),
    setFilter: (filter) => set({ filter }),
}));
