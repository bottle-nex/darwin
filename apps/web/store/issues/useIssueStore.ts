import { create } from "zustand";

export type IssueTarget =
    { board: "llm" } | { board: "custom"; columnId: string; columnTitle: string };

/**
 * Creating needs an explicit target. Opening doesn't — the issue already knows
 * where it lives, so the target is derived from its `customColumnId`.
 */
export type IssueMode = { kind: "create"; target: IssueTarget } | { kind: "open"; issueId: string };

const ISSUE_SEGMENT = /\/issue\/([^/]+)\/?$/;

export function issueIdFromPath(pathname: string): string | null {
    return pathname.match(ISSUE_SEGMENT)?.[1] ?? null;
}

function basePath(pathname: string): string {
    return pathname.replace(ISSUE_SEGMENT, "");
}

interface IssueState {
    mode: IssueMode | null;
    openCreate: (target: IssueTarget) => void;
    openIssue: (issueId: string) => void;
    /** Sets state only — for the popstate listener, where the URL already changed. */
    syncIssue: (issueId: string | null) => void;
    close: () => void;
}

export const useIssueStore = create<IssueState>((set, get) => ({
    mode: null,
    openCreate: (target) => set({ mode: { kind: "create", target } }),
    openIssue: (issueId) => {
        set({ mode: { kind: "open", issueId } });
        const base = basePath(window.location.pathname);
        window.history.pushState(null, "", `${base}/issue/${issueId}${window.location.search}`);
    },
    syncIssue: (issueId) => set({ mode: issueId ? { kind: "open", issueId } : null }),
    close: () => {
        if (!get().mode) return;
        set({ mode: null });
        const base = basePath(window.location.pathname);
        if (base !== window.location.pathname) {
            window.history.pushState(null, "", `${base}${window.location.search}`);
        }
    },
}));
