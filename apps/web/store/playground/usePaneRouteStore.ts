import { ReviewTab } from "@trymatcha/types";
import { create } from "zustand";

export type PaneRoute =
    | { kind: "board" }
    | { kind: "issue"; issueId: string }
    | { kind: "review"; pullNumber: number; slug: string; tab: ReviewTab };

const BOARD: PaneRoute = { kind: "board" };

const DEFAULT_REVIEW_TAB = ReviewTab.PullRequest;

const ISSUE_SEGMENT = /\/issue\/([^/]+)\/?$/;
const REVIEW_SEGMENT = new RegExp(
    `/review/([^/]*?)-(\\d+)(?:/(${Object.values(ReviewTab).join("|")}))?/?$`,
);

export function paneRouteFromPath(pathname: string): PaneRoute {
    const review = pathname.match(REVIEW_SEGMENT);
    if (review) {
        return {
            kind: "review",
            slug: review[1],
            pullNumber: Number(review[2]),
            tab: (review[3] as ReviewTab) ?? DEFAULT_REVIEW_TAB,
        };
    }

    const issue = pathname.match(ISSUE_SEGMENT);
    if (issue) return { kind: "issue", issueId: issue[1] };

    return BOARD;
}

function basePath(pathname: string): string {
    return pathname.replace(REVIEW_SEGMENT, "").replace(ISSUE_SEGMENT, "");
}

function segmentFor(route: PaneRoute): string {
    if (route.kind === "issue") return `/issue/${route.issueId}`;
    if (route.kind === "review") {
        const tab = route.tab === DEFAULT_REVIEW_TAB ? "" : `/${route.tab}`;
        return `/review/${route.slug}-${route.pullNumber}${tab}`;
    }
    return "";
}

export function panePath(route: PaneRoute): string {
    return `${basePath(window.location.pathname)}${segmentFor(route)}${window.location.search}`;
}

interface PaneRouteState {
    route: PaneRoute;
    openIssue: (issueId: string) => void;
    openReview: (target: { pullNumber: number; slug: string; tab?: ReviewTab }) => void;
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
        openReview: ({ pullNumber, slug, tab = DEFAULT_REVIEW_TAB }) => {
            const route = get().route;
            if (route.kind === "review" && route.pullNumber === pullNumber) return;
            go({ kind: "review", pullNumber, slug, tab });
        },
        setReviewTab: (tab) => {
            const route = get().route;
            if (route.kind !== "review" || route.tab === tab) return;
            go({ ...route, tab });
        },
        openBoard: () => {
            if (get().route.kind === "board") return;
            go(BOARD);
        },
        sync: (route) => set({ route }),
    };
});
