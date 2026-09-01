"use client";
import { IssueStatus } from "@trymatcha/types";
import { FileIcon, MergeIcon, PullRequestOpenIcon } from "@trymatcha/ui/icons";

import { reviewSlugFor } from "@/components/playground/Review/reviewSlug";
import { useSolveReports } from "@/hooks/issues/useSolveReports";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import { useSolveReportStore } from "@/store/playground/useSolveReportStore";
import type { BoardIssue } from "@/types/board";

import { CapsuleTrigger } from "./Capsule";
import { STACKED_CAPSULE } from "./issueHelpers";
import PropertyGroup from "./PropertyGroup";

export default function IssueAttachments({ issue }: { issue: BoardIssue }) {
    const openReview = usePaneRouteStore((s) => s.openReview);
    const openSolveReport = useSolveReportStore((s) => s.open);
    const { data: reports } = useSolveReports(issue.id);
    const pullNumber = issue.prNumber;

    const hasPullRequest = Boolean(issue.prUrl) && pullNumber !== null;
    const hasReport = Boolean(reports?.length);

    if (!hasPullRequest && !hasReport) return null;

    const merged = issue.status === IssueStatus.Done;
    const PullRequestIcon = merged ? MergeIcon : PullRequestOpenIcon;

    return (
        <PropertyGroup title="Attachments">
            {hasPullRequest && (
                <CapsuleTrigger
                    className={STACKED_CAPSULE}
                    onClick={() =>
                        openReview({ pullNumber: pullNumber!, slug: reviewSlugFor(issue) })
                    }
                >
                    <PullRequestIcon
                        className={
                            merged ? "size-3.75! text-violet-400" : "size-3.75! text-green-500"
                        }
                    />
                    Pull request
                </CapsuleTrigger>
            )}
            {hasReport && (
                <CapsuleTrigger
                    className={STACKED_CAPSULE}
                    onClick={() => openSolveReport(issue.id)}
                >
                    <FileIcon className="size-3.75! text-neutral-400" />
                    How this was solved
                </CapsuleTrigger>
            )}
        </PropertyGroup>
    );
}
