"use client";
import { ReviewTab } from "@trymatcha/types";
import { Button } from "@/components/ui/button";
import LogoLoader from "@/components/app/LogoLoader";
import PaneColumns from "@/components/playground/Core/components/PaneColumns";
import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import { useReview } from "@/hooks/review/useReview";
import { usePaneRouteStore, type PaneRoute } from "@/store/playground/usePaneRouteStore";
import ReviewChanges from "./changes/ReviewChanges";
import DiffDisplay from "./diff/DiffDisplay";
import ReviewPullRequest from "./pull-request/ReviewPullRequest";
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
                    trail={[
                        {
                            label: `#${review.issueNumber} ${review.issueTitle}`,
                            onClick: () => openIssue(review.issueId),
                        },
                        `#${review.pullNumber} ${review.title}`,
                    ]}
                />
            </PaneLeadSlot>

            <ReviewHeader tab={route.tab} htmlUrl={review.htmlUrl} />

            {route.tab === ReviewTab.Changes ? (
                <ReviewChanges projectId={projectId} review={review} />
            ) : (
                <PaneColumns aside={<ReviewIssueProperties issueId={review.issueId} />}>
                    {route.tab === ReviewTab.Diff ? (
                        <DiffDisplay
                            productDiffId={review.productDiffId}
                            issueId={review.issueId}
                        />
                    ) : (
                        <ReviewPullRequest projectId={projectId} review={review} />
                    )}
                </PaneColumns>
            )}
        </main>
    );
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
