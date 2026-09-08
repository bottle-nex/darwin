import { create } from "zustand";

interface DarwinThreadState {
    /** Null means the pane shows its empty state; the first send creates a thread server-side. */
    threadId: string | null;
    open: (threadId: string) => void;
    reset: () => void;
}

export const useDarwinThreadStore = create<DarwinThreadState>((set) => ({
    threadId: null,
    open: (threadId) => set({ threadId }),
    reset: () => set({ threadId: null }),
}));
