import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { IconPick } from "@/components/ui/IconPicker";
import { boardColumnsKey } from "@/hooks/issues/boardCache";
import { apiClient } from "@/lib/axios";
import { CREATE_CHAPTER_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardChapter, BoardMetadata } from "@/types/board";

export interface CreateChapterInput {
    project_id: string;
    name: string;
    slug: string;
    icon?: IconPick | null;
}

export function useCreateChapter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateChapterInput) => {
            const res = await apiClient.post<ApiResponse<{ chapter: BoardChapter }>>(
                CREATE_CHAPTER_URL,
                input,
            );
            return res.data.data.chapter;
        },
        onSuccess: (chapter, variables) => {
            queryClient.setQueryData<BoardMetadata>(
                boardColumnsKey(variables.project_id),
                (data) => {
                    if (!data) return data;
                    return {
                        ...data,
                        chapters: [
                            ...data.chapters.filter((row) => row.id !== chapter.id),
                            chapter,
                        ],
                    };
                },
            );
        },
    });
}
