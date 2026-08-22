"use client";
import { GoGitPullRequest } from "react-icons/go";
import type { BoardIssue } from "@/types/board";
import { reviewSlugFor } from "@/components/playground/Review/reviewSlug";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import { CapsuleTrigger } from "./Capsule";
import PropertyGroup from "./PropertyGroup";
import { STACKED_CAPSULE } from "./issueHelpers";

export default function IssueAttachments({ issue }: { issue: BoardIssue }) {
    const openReview = usePaneRouteStore((s) => s.openReview);
    const pullNumber = issue.prNumber;

    if (!issue.prUrl || pullNumber === null) return null;

    return (
        <PropertyGroup title="Attachments">
            <CapsuleTrigger
                className={STACKED_CAPSULE}
                onClick={() => openReview({ pullNumber, slug: reviewSlugFor(issue) })}
            >
                <GoGitPullRequest className="size-3.75! text-green-500" />
                Pull request
            </CapsuleTrigger>
        </PropertyGroup>
    );
}
