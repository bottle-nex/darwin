"use client";
import { AgentSessionStatus } from "@trymatcha/types";
import {
    CancelledStatusIcon,
    ErrorCircleIcon,
    type IconType,
    RunCompletedActivityIcon,
    RunStartedActivityIcon,
    TodoStatusIcon,
} from "@trymatcha/ui/icons";
import { Children, type ReactElement, type ReactNode, useState } from "react";

import TreeBranch from "@/components/playground/Core/components/TreeBranch";
import { reviewSlugFor } from "@/components/playground/Review/reviewSlug";
import { useIssueAttempts } from "@/hooks/issues/useIssueAttempts";
import { PULL_REQUEST_STATE } from "@/lib/review/pullRequestState";
import { cn } from "@/lib/utils";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import type { BoardIssue } from "@/types/board";
import type { IssueAttempt } from "@/types/issueAttempt.type";

import { CapsuleTrigger } from "./Capsule";
import { canReopen, STACKED_CAPSULE } from "./issueHelpers";
import PropertyGroup from "./PropertyGroup";
import ReopenIssueDialog from "./ReopenIssueDialog";

const ATTEMPT_GLYPH: Record<AgentSessionStatus, { icon: IconType; className: string }> = {
    [AgentSessionStatus.Running]: {
        icon: RunStartedActivityIcon,
        className: "text-snow/60",
    },
    [AgentSessionStatus.Succeeded]: {
        icon: RunCompletedActivityIcon,
        className: "text-snow/60",
    },
    [AgentSessionStatus.Failed]: { icon: ErrorCircleIcon, className: "text-red-300" },
    [AgentSessionStatus.Aborted]: { icon: CancelledStatusIcon, className: "text-snow/50" },
};

function attemptDetail(attempt: IssueAttempt): string {
    if (attempt.status === AgentSessionStatus.Running) return "running";
    if (attempt.status === AgentSessionStatus.Failed) return "failed";
    if (attempt.status === AgentSessionStatus.Aborted) return "stopped";
    if (attempt.commits === null) return "finished";
    if (attempt.commits === 0) return "no commits";
    return `${attempt.commits} commit${attempt.commits === 1 ? "" : "s"}`;
}

const TREE_ROW = "w-full justify-start pl-[30px]";

function TreeRows({ children }: { children: ReactNode }) {
    const rows = Children.toArray(children);
    return (
        <div className="flex flex-col">
            {rows.map((row, index) => (
                <div key={(row as ReactElement).key} className="relative">
                    {row}
                    <TreeBranch last={index === rows.length - 1} />
                </div>
            ))}
        </div>
    );
}

export default function IssuePullRequestTree({ issue }: { issue: BoardIssue }) {
    const openReview = usePaneRouteStore((s) => s.openReview);
    const openSolveReport = usePaneRouteStore((s) => s.openSolveReport);
    const { data } = useIssueAttempts(issue.id);
    const [reopening, setReopening] = useState(false);

    const pullRequest = data?.pullRequest;
    const attempts = data?.attempts ?? [];
    const reopenable = canReopen(issue) && !pullRequest?.merged;

    if (!pullRequest && !attempts.length && !reopenable) return null;

    const state = pullRequest?.merged ? PULL_REQUEST_STATE.merged : PULL_REQUEST_STATE.open;
    const PullRequestIcon = state.icon;

    return (
        <>
            <PropertyGroup title={pullRequest ? "Pull request" : "Agent runs"}>
                {pullRequest && (
                    <CapsuleTrigger
                        className={cn(STACKED_CAPSULE, "justify-start")}
                        onClick={() =>
                            openReview({
                                pullNumber: pullRequest.number,
                                slug: reviewSlugFor(issue),
                            })
                        }
                    >
                        <PullRequestIcon className={cn("size-3.75!", state.text)} />
                        <span className="truncate">#{pullRequest.number}</span>
                        <span className="text-neutral-500">{state.label}</span>
                    </CapsuleTrigger>
                )}

                <TreeRows>
                    {attempts.map((attempt) => {
                        const glyph = ATTEMPT_GLYPH[attempt.status];
                        const AttemptIcon = glyph.icon;
                        return (
                            <div key={attempt.id} className="flex flex-col">
                                <CapsuleTrigger
                                    className={cn(STACKED_CAPSULE, TREE_ROW)}
                                    onClick={() => openSolveReport(issue.id)}
                                >
                                    <AttemptIcon
                                        className={cn("size-3.5!", glyph.className)}
                                        aria-hidden
                                    />
                                    <span className="truncate">
                                        Attempt {attempt.attemptNumber}
                                    </span>
                                    <span className="text-neutral-500">
                                        {attemptDetail(attempt)}
                                    </span>
                                </CapsuleTrigger>
                                {attempt.reopenedBy && (
                                    <p className="truncate pr-2 pl-[30px] text-[12px] text-neutral-500">
                                        {attempt.reopenedBy.note}
                                    </p>
                                )}
                            </div>
                        );
                    })}

                    {reopenable && (
                        <CapsuleTrigger
                            className={cn(STACKED_CAPSULE, TREE_ROW)}
                            onClick={() => setReopening(true)}
                        >
                            <TodoStatusIcon className="size-3.5! text-neutral-400" aria-hidden />
                            Ask for another commit
                        </CapsuleTrigger>
                    )}
                </TreeRows>
            </PropertyGroup>

            <ReopenIssueDialog issue={issue} open={reopening} onOpenChange={setReopening} />
        </>
    );
}
