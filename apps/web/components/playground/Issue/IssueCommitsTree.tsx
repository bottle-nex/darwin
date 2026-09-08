"use client";
import { IssueStatus, ReviewTab } from "@trydarwin/types";
import { AddIcon, CommitsIcon } from "@trydarwin/ui/icons";
import { Children, type ReactElement, type ReactNode, useState } from "react";

import TreeBranch from "@/components/playground/Core/components/TreeBranch";
import { reviewSlugFor } from "@/components/playground/Review/reviewSlug";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useReviewCommits } from "@/hooks/review/useReviewCommits";
import { useActiveProject } from "@/hooks/useActiveProject";
import { PULL_REQUEST_STATE } from "@/lib/review/pullRequestState";
import { cn } from "@/lib/utils";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import type { BoardIssue } from "@/types/board";

import {
    ATTACHMENT_GLYPH,
    ATTACHMENT_ROW,
    ATTACHMENT_ROW_CHILD,
    ATTACHMENT_TREE_BRANCH,
    canReopen,
} from "./issueHelpers";
import ReopenIssueDialog from "./ReopenIssueDialog";

function TreeRows({ children }: { children: ReactNode }) {
    const rows = Children.toArray(children);
    if (!rows.length) return null;

    return (
        <div className="flex w-full flex-col">
            {rows.map((row, index) => (
                <div key={(row as ReactElement).key} className="relative">
                    {row}
                    <TreeBranch
                        last={index === rows.length - 1}
                        className={ATTACHMENT_TREE_BRANCH}
                    />
                </div>
            ))}
        </div>
    );
}

export default function IssueCommitsTree({ issue }: { issue: BoardIssue }) {
    const projectId = useActiveProject()?.id;
    const openReview = usePaneRouteStore((s) => s.openReview);
    const { data: commits } = useReviewCommits(projectId, issue.prNumber);
    const [reopening, setReopening] = useState(false);

    const pullNumber = issue.prNumber;
    const merged = issue.status === IssueStatus.Done;
    const reopenable = canReopen(issue);

    if (pullNumber === null && !reopenable) return null;

    const state = merged ? PULL_REQUEST_STATE.merged : PULL_REQUEST_STATE.open;
    const PullRequestIcon = state.icon;

    function openChanges(commit?: string) {
        if (pullNumber === null) return;
        openReview({
            pullNumber,
            slug: reviewSlugFor(issue),
            ...(commit ? { tab: ReviewTab.Changes, commit } : {}),
        });
    }

    return (
        <div className="flex w-full flex-col">
            {pullNumber !== null && (
                <button
                    type="button"
                    className={cn(ATTACHMENT_ROW, "cursor-pointer")}
                    onClick={() => openChanges()}
                >
                    <PullRequestIcon className={cn(ATTACHMENT_GLYPH, state.text)} aria-hidden />
                    <span className="shrink-0">#{pullNumber}</span>
                    <span className="truncate text-neutral-500">{state.label}</span>
                </button>
            )}

            <TreeRows>
                {(commits ?? []).map((commit) => (
                    <TooltipComponent key={commit.sha} content={commit.subject}>
                        <button
                            type="button"
                            className={cn(ATTACHMENT_ROW, ATTACHMENT_ROW_CHILD, "cursor-pointer")}
                            onClick={() => openChanges(commit.sha)}
                        >
                            <CommitsIcon
                                className={cn(ATTACHMENT_GLYPH, "text-neutral-400")}
                                aria-hidden
                            />
                            <span className="truncate">{commit.subject}</span>
                        </button>
                    </TooltipComponent>
                ))}

                {reopenable && !merged && (
                    <button
                        key="reopen"
                        type="button"
                        className={cn(
                            ATTACHMENT_ROW,
                            ATTACHMENT_ROW_CHILD,
                            "cursor-pointer text-neutral-400",
                        )}
                        onClick={() => setReopening(true)}
                    >
                        <AddIcon className={cn(ATTACHMENT_GLYPH, "text-neutral-500")} aria-hidden />
                        <span className="truncate">Ask for another commit</span>
                    </button>
                )}
            </TreeRows>

            <ReopenIssueDialog issue={issue} open={reopening} onOpenChange={setReopening} />
        </div>
    );
}
