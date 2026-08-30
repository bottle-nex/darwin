"use client";
import { PullRequestOpenIcon } from "@trymatcha/ui/icons";

import { reviewSlugFor } from "@/components/playground/Review/reviewSlug";
import IconWrapper from "@/components/ui/IconWrapper";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import type { Issue } from "@/types/kanban";

import AgentChip from "./AgentChip";
import BaseCard from "./BaseCard";

/** In Review: the agent opened a PR back to the repo, awaiting human review. */
export default function InReviewCard({ issue }: { issue: Issue }) {
    const openReview = usePaneRouteStore((s) => s.openReview);
    const pullNumber = issue.boardIssue?.prNumber ?? null;

    return (
        <BaseCard issue={issue}>
            <div className="mt-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        disabled={pullNumber === null}
                        aria-label={`Review pull request #${issue.pr?.number}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (pullNumber === null || !issue.boardIssue) return;
                            openReview({
                                pullNumber,
                                slug: reviewSlugFor(issue.boardIssue),
                            });
                        }}
                        className="cursor-pointer disabled:cursor-default"
                    >
                        <IconWrapper
                            icon={PullRequestOpenIcon}
                            variant="ring"
                            iconClassName="text-green-500"
                            title={pullNumber === null ? undefined : "Open the review"}
                        >
                            <span className="text-[12px] text-snow">{issue.pr?.number}</span>
                        </IconWrapper>
                    </button>
                    {issue.pr?.added !== undefined && issue.pr.removed !== undefined && (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                            <span className="text-emerald-400">+{issue.pr.added}</span>
                            <span className="text-rose-400">-{issue.pr.removed}</span>
                        </span>
                    )}
                </div>
                {issue.agent && (
                    <div className="flex justify-end">
                        <AgentChip name={issue.agent} />
                    </div>
                )}
            </div>
        </BaseCard>
    );
}
