"use client";

import { useEffect } from "react";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import type { BoardView } from "@/types/kanban";

const PREVIEW_PARAM = "preview";

const BOARD_VIEW_BY_PREVIEW: Record<string, BoardView> = {
    agent: "llm",
    custom: "custom",
};

const PREVIEW_BY_BOARD_VIEW: Partial<Record<BoardView, string>> = {
    llm: "agent",
    custom: "custom",
};

function writeBoardViewToUrl(boardView: BoardView) {
    const params = new URLSearchParams(window.location.search);
    const preview = PREVIEW_BY_BOARD_VIEW[boardView];
    if (preview) params.set(PREVIEW_PARAM, preview);
    else params.delete(PREVIEW_PARAM);

    const next = `${window.location.pathname}?${params.toString()}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState(null, "", next);
    }
}

export function useKanbanBoardViewUrlSync() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const initialBoardView =
            BOARD_VIEW_BY_PREVIEW[params.get(PREVIEW_PARAM) ?? ""] ?? "default";
        useKanbanOptionsStore.getState().setBoardView(initialBoardView);
        writeBoardViewToUrl(initialBoardView);

        return useKanbanOptionsStore.subscribe((state, previousState) => {
            if (state.boardView !== previousState.boardView) {
                writeBoardViewToUrl(state.boardView);
            }
        });
    }, []);
}
