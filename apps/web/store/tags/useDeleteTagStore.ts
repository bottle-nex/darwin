import { create } from "zustand";
import type { Tag } from "@/types/tags";

interface DeleteTagState {
    tags: Tag[];
    requestDelete: (...tags: Tag[]) => void;
    close: () => void;
}

export const useDeleteTagStore = create<DeleteTagState>((set) => ({
    tags: [],
    requestDelete: (...tags) => set({ tags }),
    close: () => set({ tags: [] }),
}));
