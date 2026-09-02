"use client";

import { useEffect } from "react";

import { isTyping } from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { useMemberSelectionStore } from "@/store/team/useMemberSelectionStore";

function hoveredMemberKey(): string | null {
    const hovered = document.querySelectorAll<HTMLElement>("[data-member-id]:hover");
    return hovered[hovered.length - 1]?.dataset.memberId ?? null;
}

function blurFocusedMember() {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.closest("[data-member-id]")) focused.blur();
}

export function useMemberSelectionShortcuts() {
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

            if (event.key === "Escape") {
                event.preventDefault();
                useMemberSelectionStore.getState().clear();
                blurFocusedMember();
                return;
            }
            if (event.key.toLowerCase() !== "x") return;

            const memberKey = hoveredMemberKey();
            if (!memberKey) return;
            event.preventDefault();
            useMemberSelectionStore.getState().toggle(memberKey);
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
}
