"use client";

import type { MouseEvent } from "react";
import {
    useIssueSelectionStore,
    type IssueSelectionScope,
} from "@/store/issues/useIssueSelectionStore";

const EMPTY: string[] = [];

function renderedIssueIds(): string[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[data-issue-id]")).map(
        (element) => element.dataset.issueId!,
    );
}

export function useIssueSelection(scope: IssueSelectionScope) {
    const selectedIds = useIssueSelectionStore((s) => (s.scope === scope ? s.ids : EMPTY));
    const toggle = useIssueSelectionStore((s) => s.toggle);
    const extendTo = useIssueSelectionStore((s) => s.extendTo);

    function handleSelectClick(event: MouseEvent, issueId: string): boolean {
        if (selectedIds.length && !event.shiftKey) {
            event.preventDefault();
            toggle(scope, issueId);
            return true;
        }
        if (event.shiftKey) {
            event.preventDefault();
            extendTo(scope, issueId, renderedIssueIds());
            return true;
        }
        if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            toggle(scope, issueId);
            return true;
        }
        return false;
    }

    return {
        selectedIds,
        isSelected: (issueId: string) => selectedIds.includes(issueId),
        handleSelectClick,
    };
}
