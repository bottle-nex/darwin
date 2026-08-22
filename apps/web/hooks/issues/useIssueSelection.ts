"use client";

import { createContext, createElement, useContext, type MouseEvent, type ReactNode } from "react";
import {
    useIssueSelectionStore,
    type IssueSelectionScope,
} from "@/store/issues/useIssueSelectionStore";

const EMPTY: string[] = [];
const IssueSelectionOrderContext = createContext<string[] | null>(null);

function renderedIssueIds(scope: IssueSelectionScope): string[] {
    return Array.from(
        document.querySelectorAll<HTMLElement>(`[data-issue-id][data-selection-scope="${scope}"]`),
    ).map((element) => element.dataset.issueId!);
}

export function useIssueSelection(scope: IssueSelectionScope) {
    const loadedIssueIds = useContext(IssueSelectionOrderContext);
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
            extendTo(scope, issueId, loadedIssueIds ?? renderedIssueIds(scope));
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
        toggleSelection: (issueId: string) => toggle(scope, issueId),
        handleSelectClick,
    };
}

export function IssueSelectionOrderProvider({
    issueIds,
    children,
}: {
    issueIds: string[];
    children: ReactNode;
}) {
    return createElement(IssueSelectionOrderContext.Provider, { value: issueIds }, children);
}
