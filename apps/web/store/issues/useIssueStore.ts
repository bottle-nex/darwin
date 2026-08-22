import { create } from "zustand";

export type IssueTarget =
    { board: "llm" } | { board: "custom"; columnId: string; columnTitle: string };

export type IssueView = "detail" | "diff";

export type IssueRoute = { issueId: string; view: IssueView };

/**
 * Creating needs an explicit target. Opening doesn't — the issue already knows
 * where it lives, so the target is derived from its `customColumnId`.
 */
export type IssueMode = { kind: "create"; target: IssueTarget } | ({ kind: "open" } & IssueRoute);

const ISSUE_SEGMENT = /\/issue\/([^/]+)(?:\/(diff))?\/?$/;

export function issueRouteFromPath(pathname: string): IssueRoute | null {
    const match = pathname.match(ISSUE_SEGMENT);
    if (!match) return null;
    return { issueId: match[1], view: match[2] === "diff" ? "diff" : "detail" };
}

function basePath(pathname: string): string {
    return pathname.replace(ISSUE_SEGMENT, "");
}

function pushIssuePath({ issueId, view }: IssueRoute) {
    const base = basePath(window.location.pathname);
    const suffix = view === "diff" ? "/diff" : "";
    window.history.pushState(
        null,
        "",
        `${base}/issue/${issueId}${suffix}${window.location.search}`,
    );
}

interface IssueState {
    mode: IssueMode | null;
    openCreate: (target: IssueTarget) => void;
    openIssue: (issueId: string) => void;
    openIssueDiff: (issueId: string) => void;
    showIssueDetail: () => void;
    /** Sets state only — for the popstate listener, where the URL already changed. */
    syncIssue: (route: IssueRoute | null) => void;
    close: () => void;
}

export const useIssueStore = create<IssueState>((set, get) => ({
    mode: null,
    openCreate: (target) => set({ mode: { kind: "create", target } }),
    openIssue: (issueId) => {
        set({ mode: { kind: "open", issueId, view: "detail" } });
        pushIssuePath({ issueId, view: "detail" });
    },
    openIssueDiff: (issueId) => {
        set({ mode: { kind: "open", issueId, view: "diff" } });
        pushIssuePath({ issueId, view: "diff" });
    },
    showIssueDetail: () => {
        const mode = get().mode;
        if (mode?.kind !== "open" || mode.view === "detail") return;
        set({ mode: { ...mode, view: "detail" } });
        pushIssuePath({ issueId: mode.issueId, view: "detail" });
    },
    syncIssue: (route) => set({ mode: route ? { kind: "open", ...route } : null }),
    close: () => {
        if (!get().mode) return;
        set({ mode: null });
        const base = basePath(window.location.pathname);
        if (base !== window.location.pathname) {
            window.history.pushState(null, "", `${base}${window.location.search}`);
        }
    },
}));
