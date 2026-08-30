"use client";

import { useEffect } from "react";

import { isTyping } from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { useSpaceSelectionStore } from "@/store/space/useSpaceSelectionStore";

function hoveredSpaceId(): string | null {
    const hovered = document.querySelectorAll<HTMLElement>("[data-space-id]:hover");
    return hovered[hovered.length - 1]?.dataset.spaceId ?? null;
}

function blurFocusedSpace() {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.closest("[data-space-id]")) focused.blur();
}

export function useSpaceSelectionShortcuts() {
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

            if (event.key === "Escape") {
                event.preventDefault();
                useSpaceSelectionStore.getState().clear();
                blurFocusedSpace();
                return;
            }
            if (event.key.toLowerCase() !== "x") return;

            const spaceId = hoveredSpaceId();
            if (!spaceId) return;
            event.preventDefault();
            useSpaceSelectionStore.getState().toggle(spaceId);
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
}
