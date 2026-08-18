import { create } from "zustand";
import type { Tag } from "@/types/tags";

interface DeleteTagState {
    tag: Tag | null;
    requestDelete: (tag: Tag) => void;
    close: () => void;
}

export const useDeleteTagStore = create<DeleteTagState>((set) => ({
    tag: null,
    requestDelete: (tag) => set({ tag }),
    close: () => set({ tag: null }),
}));
