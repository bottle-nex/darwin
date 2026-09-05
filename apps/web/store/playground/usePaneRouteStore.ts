import { ReviewTab } from "@trymatcha/types";
import { create } from "zustand";

export type PaneRoute =
    | { kind: "board" }
    | { kind: "issue"; issueId: string }
    | { kind: "solve-report"; issueId: string }
    | { kind: "review"; pullNumber: number; slug: string; tab: ReviewTab; commit?: string };

const BOARD: PaneRoute = { kind: "board" };

const DEFAULT_REVIEW_TAB = ReviewTab.PullRequest;

const ISSUE_SEGMENT = /\/issue\/([^/]+)\/?$/;
const SOLVE_REPORT_SEGMENT = /\/issue\/([^/]+)\/report\/?$/;
const REVIEW_SEGMENT = new RegExp(
    `/review/([^/]*?)-(\\d+)(?:/(${Object.values(ReviewTab).join("|")}))?(?:/([0-9a-f]{7,40}))?/?$`,
);

type ReviewRoute = Extract<PaneRoute, { kind: "review" }>;

/**
 * A commit filter belongs to the Changes tab, so it never survives a move to another tab. That
 * keeps the path honest: the default tab is omitted from it, so a commit segment can only ever
 * follow an explicit `/changes`.
 */
function reviewRoute(route: ReviewRoute): ReviewRoute {
    const commit = route.tab === ReviewTab.Changes ? route.commit : undefined;
    return {
        kind: "review",
        pullNumber: route.pullNumber,
        slug: route.slug,
        tab: route.tab,
        ...(commit ? { commit } : {}),
    };
}

function sameReview(current: PaneRoute, next: ReviewRoute): boolean {
    return (
        current.kind === "review" &&
        current.pullNumber === next.pullNumber &&
        current.tab === next.tab &&
        current.commit === next.commit
    );
}

export function paneRouteFromPath(pathname: string): PaneRoute {
    const review = pathname.match(REVIEW_SEGMENT);
    if (review) {
        return reviewRoute({
            kind: "review",
            slug: review[1],
            pullNumber: Number(review[2]),
            tab: (review[3] as ReviewTab) ?? DEFAULT_REVIEW_TAB,
            commit: review[4],
        });
    }

    // Checked before the issue segment: both start `/issue/<id>`, and the issue pattern is
    // anchored to the end, so only the more specific one can match a report URL.
    const report = pathname.match(SOLVE_REPORT_SEGMENT);
    if (report) return { kind: "solve-report", issueId: report[1] };

    const issue = pathname.match(ISSUE_SEGMENT);
    if (issue) return { kind: "issue", issueId: issue[1] };

    return BOARD;
}

function basePath(pathname: string): string {
    return pathname
        .replace(REVIEW_SEGMENT, "")
        .replace(SOLVE_REPORT_SEGMENT, "")
        .replace(ISSUE_SEGMENT, "");
}

function segmentFor(route: PaneRoute): string {
    if (route.kind === "issue") return `/issue/${route.issueId}`;
    if (route.kind === "solve-report") return `/issue/${route.issueId}/report`;
    if (route.kind === "review") {
        const tab = route.tab === DEFAULT_REVIEW_TAB ? "" : `/${route.tab}`;
        const commit = route.commit ? `/${route.commit}` : "";
        return `/review/${route.slug}-${route.pullNumber}${tab}${commit}`;
    }
    return "";
}

export function panePath(route: PaneRoute): string {
    return `${basePath(window.location.pathname)}${segmentFor(route)}${window.location.search}`;
}

interface PaneRouteState {
    route: PaneRoute;
    openIssue: (issueId: string) => void;
    openSolveReport: (issueId: string) => void;
    openReview: (target: {
        pullNumber: number;
        slug: string;
        tab?: ReviewTab;
        commit?: string;
    }) => void;
    setReviewTab: (tab: ReviewTab) => void;
    openBoard: () => void;
    sync: (route: PaneRoute) => void;
}

export const usePaneRouteStore = create<PaneRouteState>((set, get) => {
    function go(route: PaneRoute) {
        set({ route });
        window.history.pushState(null, "", panePath(route));
    }

    return {
        route: BOARD,
        openIssue: (issueId) => {
            const route = get().route;
            if (route.kind === "issue" && route.issueId === issueId) return;
            go({ kind: "issue", issueId });
        },
        openSolveReport: (issueId) => {
            const route = get().route;
            if (route.kind === "solve-report" && route.issueId === issueId) return;
            go({ kind: "solve-report", issueId });
        },
        openReview: ({ pullNumber, slug, tab = DEFAULT_REVIEW_TAB, commit }) => {
            const next = reviewRoute({ kind: "review", pullNumber, slug, tab, commit });
            if (sameReview(get().route, next)) return;
            go(next);
        },
        setReviewTab: (tab) => {
            const route = get().route;
            if (route.kind !== "review" || route.tab === tab) return;
            go(reviewRoute({ ...route, tab }));
        },
        openBoard: () => {
            if (get().route.kind === "board") return;
            go(BOARD);
        },
        sync: (route) => set({ route }),
    };
});
