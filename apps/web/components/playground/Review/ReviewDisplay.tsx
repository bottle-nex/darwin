"use client";
import { type ReviewHeader as ReviewHeaderData, ReviewTab } from "@trymatcha/types";
import { MergeIcon } from "@trymatcha/ui/icons";

import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import PaneColumns from "@/components/playground/Core/components/PaneColumns";
import PaneFallback from "@/components/playground/Core/components/PaneFallback";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import ReadOnlyIssueProperties from "@/components/playground/Issue/ReadOnlyIssueProperties";
import { Button } from "@/components/ui/button";
import { useReview } from "@/hooks/review/useReview";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import { useActiveProject } from "@/hooks/useActiveProject";
import { type PaneRoute, usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

import ChangesReviewDisplay from "./changes/ChangesReviewDisplay";
import DiffReviewDisplay from "./diff/DiffReviewDisplay";
import PullRequestReviewDisplay from "./pull-request/PullRequestReviewDisplay";
import ReviewHeader from "./ReviewHeader";

type ReviewRoute = Extract<PaneRoute, { kind: "review" }>;

export default function ReviewDisplay({ route }: { route: ReviewRoute }) {
    const projectId = useActiveProject()?.id;
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const openBoard = usePaneRouteStore((s) => s.openBoard);
    const { data: review, isPending } = useReview(projectId, route.pullNumber);

    useEscapeExit({ onExit: () => (review ? openIssue(review.issueId) : openBoard()) });

    if (isPending) return <PaneFallback />;

    if (!review) {
        return (
            <PaneFallback>
                <p className="text-[14.5px] text-neutral-500">
                    This pull request is no longer available.
                </p>
                <Button size="xs" variant="tertiary" onClick={openBoard}>
                    Back to board
                </Button>
            </PaneFallback>
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
                    trailingIcon={MergeIcon}
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
                <PaneColumns aside={<ReadOnlyIssueProperties issueId={review.issueId} />}>
                    <PullRequestReviewDisplay projectId={projectId} review={review} />
                </PaneColumns>
            );
    }
}
