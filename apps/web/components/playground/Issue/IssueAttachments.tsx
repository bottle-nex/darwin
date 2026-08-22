"use client";
import { GoGitPullRequest } from "react-icons/go";
import { PiSquareSplitHorizontalFill } from "react-icons/pi";
import type { BoardIssue } from "@/types/board";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useIssueProductDiff } from "@/hooks/project/useIssueProductDiff";
import { CapsuleTrigger } from "./Capsule";
import PropertyGroup from "./PropertyGroup";
import { STACKED_CAPSULE } from "./issueHelpers";
import { cn } from "@/lib/utils";
import { useIssueNavigation } from "./useIssueNavigation";

export default function IssueAttachments({ issue }: { issue: BoardIssue }) {
    const projectId = useActiveProject()?.id;
    const { diff } = useIssueProductDiff(projectId, issue.id);
    const { openIssueDiff } = useIssueNavigation();

    if (!issue.prUrl && !diff) return null;

    return (
        <PropertyGroup title="Attachments">
            {issue.prUrl && (
                <a
                    href={issue.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className={cn(
                        "flex w-fit! cursor-pointer items-center gap-1.5 rounded-full! bg-white/5 px-2! py-1! text-[13px]! font-medium text-white/55 ring ring-white/10 transition-colors hover:bg-white/10",
                        STACKED_CAPSULE,
                    )}
                >
                    <GoGitPullRequest className="size-3.75! text-green-500" />
                    Pull request
                </a>
            )}
            {diff && (
                <CapsuleTrigger className={STACKED_CAPSULE} onClick={() => openIssueDiff(issue.id)}>
                    <PiSquareSplitHorizontalFill className="size-4.25! text-rose-500" />
                    Diff
                </CapsuleTrigger>
            )}
        </PropertyGroup>
    );
}
