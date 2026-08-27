import { useMutation, useQueryClient } from "@tanstack/react-query";

import { boardColumnsKey } from "@/hooks/issues/boardCache";
import { apiClient } from "@/lib/axios";
import { CHAPTER_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardChapter, BoardMetadata } from "@/types/board";

export interface UpdateChapterInput {
    id: string;
    project_id: string;
    name?: string;
    slug?: string;
}

export function useUpdateChapter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name, slug }: UpdateChapterInput) => {
            const res = await apiClient.patch<ApiResponse<{ chapter: BoardChapter }>>(
                CHAPTER_URL(id),
                { name, slug },
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
                        chapters: data.chapters.map((row) =>
                            row.id === chapter.id ? chapter : row,
                        ),
                    };
                },
            );
        },
    });
}
