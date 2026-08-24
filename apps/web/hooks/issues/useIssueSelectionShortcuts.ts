"use client";

import { useEffect } from "react";

import { isTyping } from "@/hooks/shortcuts/usePlaygroundShortcuts";
import {
    type IssueSelectionScope,
    useIssueSelectionStore,
} from "@/store/issues/useIssueSelectionStore";

function hoveredIssue(): { id: string; scope: IssueSelectionScope } | null {
    const hovered = document.querySelectorAll<HTMLElement>("[data-issue-id]:hover");
    const element = hovered[hovered.length - 1];
    const id = element?.dataset.issueId;
    if (!id) return null;
    const scope = (element.dataset.selectionScope as IssueSelectionScope | undefined) ?? "kanban";
    return { id, scope };
}

function blurFocusedIssue() {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.closest("[data-issue-id]")) focused.blur();
}

export function useIssueSelectionShortcuts() {
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

            if (event.key === "Escape") {
                event.preventDefault();
                useIssueSelectionStore.getState().clear();
                blurFocusedIssue();
                return;
            }
            if (event.key.toLowerCase() !== "x") return;

            const hovered = hoveredIssue();
            if (!hovered) return;
            event.preventDefault();
            useIssueSelectionStore.getState().toggle(hovered.scope, hovered.id);
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
}
