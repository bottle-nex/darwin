"use client";
import { useMemo } from "react";

import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import KanbanDisplay from "./KanbanDisplay";

export default function ChapterPane() {
    const chapter = usePlaygroundNavStore((s) => s.selectedChapter);
    const scope = useMemo(
        () => ({ kind: "chapter" as const, chapterId: chapter?.id ?? "" }),
        [chapter?.id],
    );

    if (!chapter) return null;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <KanbanDisplay key={chapter.id} scope={scope} />
        </div>
    );
}
