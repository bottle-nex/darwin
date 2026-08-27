"use client";
import { type ReviewHeader as ReviewHeaderData, ReviewTab } from "@trymatcha/types";
import { AiFillMerge } from "react-icons/ai";

import LogoLoader from "@/components/app/LogoLoader";
import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import PaneColumns from "@/components/playground/Core/components/PaneColumns";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { Button } from "@/components/ui/button";
import { useReview } from "@/hooks/review/useReview";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import { useActiveProject } from "@/hooks/useActiveProject";
import { type PaneRoute, usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

import ChangesReviewDisplay from "./changes/ChangesReviewDisplay";
import DiffReviewDisplay from "./diff/DiffReviewDisplay";
import PullRequestReviewDisplay from "./pull-request/PullRequestReviewDisplay";
import ReviewHeader from "./ReviewHeader";
import ReviewIssueProperties from "./ReviewIssueProperties";

type ReviewRoute = Extract<PaneRoute, { kind: "review" }>;

export default function ReviewDisplay({ route }: { route: ReviewRoute }) {
    const projectId = useActiveProject()?.id;
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const openBoard = usePaneRouteStore((s) => s.openBoard);
    const { data: review, isPending } = useReview(projectId, route.pullNumber);

    useEscapeExit({ onExit: () => (review ? openIssue(review.issueId) : openBoard()) });

    if (isPending) return <ReviewFallback>{null}</ReviewFallback>;

    if (!review) {
        return (
            <ReviewFallback>
                <p className="text-[14.5px] text-neutral-500">
                    This pull request is no longer available.
                </p>
                <Button size="xs" variant="tertiary" onClick={openBoard}>
                    Back to board
                </Button>
            </ReviewFallback>
        );
    }

    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            <PaneLeadSlot>
                <PlaygroundBreadcrumb
                    issue={{
                        id: review.issueId,
                        number: review.issueNumber,
                        title: review.issueTitle,
                        customColumnId: review.issueCustomColumnId,
                    }}
                    trailing={`#${review.pullNumber} ${review.title}`}
                    trailingIcon={AiFillMerge}
                />
            </PaneLeadSlot>
            <ReviewHeader tab={route.tab} htmlUrl={review.htmlUrl} />
            <ReviewTabPanels tab={route.tab} projectId={projectId} review={review} />
        </main>
    );
}

function ReviewTabPanels({
    tab,
    projectId,
    review,
}: {
    tab: ReviewTab;
    projectId: string | undefined;
    review: ReviewHeaderData;
}) {
    switch (tab) {
        case ReviewTab.Changes:
            return <ChangesReviewDisplay projectId={projectId} review={review} />;

        case ReviewTab.VisualChanges:
            return (
                <DiffReviewDisplay productDiffId={review.productDiffId} issueId={review.issueId} />
            );

        case ReviewTab.PullRequest:
            return (
                <PaneColumns aside={<ReviewIssueProperties issueId={review.issueId} />}>
                    <PullRequestReviewDisplay projectId={projectId} review={review} />
                </PaneColumns>
            );
    }
}

function ReviewFallback({ children }: { children: React.ReactNode }) {
    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            <PaneLeadSlot>
                <PlaygroundBreadcrumb />
            </PaneLeadSlot>
            {children ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-y-3">
                    {children}
                </div>
            ) : (
                <LogoLoader className="h-full w-full text-snow" />
            )}
        </main>
    );
}
