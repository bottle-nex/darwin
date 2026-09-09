"use client";
import { Action, Permissions } from "@trydarwin/access-control";
import { type ReviewHeader, ReviewState } from "@trydarwin/types";
import type { IconType } from "@trydarwin/ui/icons";
import {
    CheckIcon,
    ErrorCircleIcon,
    GithubLogoIcon,
    MergeIcon,
    MergeToneWarningIcon,
    PullRequestClosedIcon,
    StatusInfoIcon,
} from "@trydarwin/ui/icons";
import axios from "axios";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useGithubLink, useStartGithubLink } from "@/hooks/github/useGithubLink";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useCloseReview } from "@/hooks/review/useCloseReview";
import { useMergeReview } from "@/hooks/review/useMergeReview";
import { GITHUB_NOT_LINKED } from "@/hooks/review/usePostReviewComment";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type MergeTone = "clean" | "dirty" | "attention" | "checking";
type ConfirmingAction = "merge" | "close" | null;

const TONE_STYLE: Record<MergeTone, { icon: IconType; badge: string; border: string }> = {
    clean: { icon: MergeIcon, badge: "bg-green-600", border: "border-success-edge" },
    dirty: { icon: ErrorCircleIcon, badge: "bg-rose-500", border: "border-danger-edge" },
    attention: {
        icon: MergeToneWarningIcon,
        badge: "bg-amber-500",
        border: "border-warning-edge",
    },
    checking: { icon: StatusInfoIcon, badge: "bg-sky-500", border: "border-sky-500/25" },
};

function describeMergeability(
    mergeable: boolean | null,
    mergeableState: string,
): { tone: MergeTone; heading: string; subtext: string } {
    if (mergeable === null) {
        return {
            tone: "checking",
            heading: "Checking whether this branch can be merged",
            subtext: "GitHub is still calculating this — try again in a moment.",
        };
    }
    if (mergeable === false) {
        return {
            tone: "dirty",
            heading: "This branch has conflicts that must be resolved",
            subtext: "Resolve the conflicts on GitHub before merging here.",
        };
    }
    switch (mergeableState) {
        case "clean":
            return {
                tone: "clean",
                heading: "No conflicts with base branch",
                subtext: "This branch can be merged automatically.",
            };
        case "unstable":
            return {
                tone: "attention",
                heading: "Some checks haven't completed",
                subtext: "You can still merge, but some checks are still running or have failed.",
            };
        case "blocked":
            return {
                tone: "attention",
                heading: "Merging is blocked",
                subtext: "A required review or check is preventing this merge.",
            };
        case "behind":
            return {
                tone: "attention",
                heading: "This branch is out-of-date with the base branch",
                subtext: "Update the branch before merging to avoid conflicts.",
            };
        default:
            return {
                tone: "attention",
                heading: "This branch can be merged",
                subtext: "Review it on GitHub for the full status.",
            };
    }
}

export default function ReviewMergePanel({
    review,
    projectId,
}: {
    review: ReviewHeader;
    projectId: string | undefined;
}) {
    const [confirming, setConfirming] = useState<ConfirmingAction>(null);
    const [needsLink, setNeedsLink] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
    const mergeReview = useMergeReview(projectId, review.pullNumber);
    const closeReview = useCloseReview(projectId, review.pullNumber);
    const startLink = useStartGithubLink();
    const { data: project, isPending: projectPending } = useGetProject(projectId);
    const { data: link, isPending: linkPending } = useGithubLink();

    if (review.state !== ReviewState.Open) return null;

    const isLoading = projectPending || linkPending;
    const githubLinked = needsLink ? false : Boolean(link);
    const role = project?.viewerRole ?? null;
    const canManageReview = role ? Permissions.project(role, Action.project.close_review) : false;

    const { tone, heading, subtext } = describeMergeability(
        review.mergeable,
        review.mergeableState,
    );
    const { icon: Icon, badge, border } = TONE_STYLE[tone];
    const canAttemptMerge = review.mergeable !== false;

    function openConfirm(action: ConfirmingAction) {
        setErrorMessage(undefined);
        setConfirming(action);
    }

    function handleError(error: unknown) {
        const code = axios.isAxiosError(error) ? error.response?.data?.error?.code : undefined;
        if (code === GITHUB_NOT_LINKED) {
            setConfirming(null);
            setNeedsLink(true);
            return;
        }
        setErrorMessage(axios.isAxiosError(error) ? error.response?.data?.message : undefined);
    }

    return (
        <div className="flex items-start gap-3">
            <span
                className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-sm mt-0.5",
                    badge,
                )}
            >
                <Icon className="size-4.5 text-white" />
            </span>

            <div className={cn("flex-1 overflow-hidden rounded-xl border", border)}>
                <div className="px-4 py-3">
                    <p
                        className={cn(
                            "text-[13.5px] font-medium",
                            tone === "clean" ? "text-success" : "text-neutral-100",
                        )}
                    >
                        {heading}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-neutral-500">{subtext}</p>
                </div>

                <div className="flex items-center gap-3 bg-success-surface px-4 py-3">
                    {isLoading ? null : !githubLinked ? (
                        <Button
                            size="xs"
                            variant="default"
                            loading={startLink.isPending}
                            onClick={() => startLink.mutate()}
                            className="gap-x-1.5 rounded-sm bg-green-700 font-medium text-white"
                        >
                            <GithubLogoIcon />
                            Connect GitHub
                        </Button>
                    ) : (
                        <>
                            {canAttemptMerge && (
                                <Button
                                    size="xs"
                                    variant="default"
                                    className="gap-x-1.5 rounded-sm bg-green-700 font-medium text-white"
                                    disabled={!canManageReview}
                                    onClick={() => openConfirm("merge")}
                                >
                                    <CheckIcon />
                                    Merge pull request
                                </Button>
                            )}
                            <Button
                                size="xs"
                                variant="ghost"
                                className="rounded-sm font-medium text-overlay gap-x-2"
                                disabled={!canManageReview}
                                onClick={() => openConfirm("close")}
                            >
                                <PullRequestClosedIcon className="text-danger" />
                                Close pull request
                            </Button>
                            {canAttemptMerge && (
                                <span className="text-[12px] text-neutral-500">
                                    {canManageReview
                                        ? `Squash and merge into ${review.baseBranch}`
                                        : "You don't have permission to merge or close pull requests."}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={confirming === "merge"}
                onOpenChange={(open) => !open && setConfirming(null)}
                title="Merge pull request?"
                description={`Squash and merge #${review.pullNumber} into ${review.baseBranch}. This cannot be undone.`}
                cancel={{
                    label: "Cancel",
                    variant: "tertiary",
                    onClick: () => setConfirming(null),
                }}
                confirm={{
                    label: "Merge pull request",
                    variant: "default",
                    onClick: () =>
                        mergeReview.mutate(undefined, {
                            onSuccess: () => {
                                setConfirming(null);
                                toast.success("Pull request merged.", {
                                    description: `#${review.pullNumber} into ${review.baseBranch}`,
                                    action: {
                                        label: "View on GitHub",
                                        onClick: () => window.open(review.htmlUrl, "_blank"),
                                    },
                                });
                            },
                            onError: handleError,
                        }),
                }}
                pending={mergeReview.isPending}
                error={errorMessage}
            />

            <ConfirmDialog
                open={confirming === "close"}
                onOpenChange={(open) => !open && setConfirming(null)}
                title="Close pull request?"
                description={`#${review.pullNumber} will be closed without merging. It can be reopened later on GitHub.`}
                cancel={{
                    label: "Cancel",
                    variant: "tertiary",
                    onClick: () => setConfirming(null),
                }}
                confirm={{
                    label: "Close pull request",
                    variant: "destructive",
                    onClick: () =>
                        closeReview.mutate(undefined, {
                            onSuccess: () => {
                                setConfirming(null);
                                toast.success("Pull request closed.", {
                                    description: `#${review.pullNumber} can be reopened on GitHub.`,
                                    action: {
                                        label: "View on GitHub",
                                        onClick: () => window.open(review.htmlUrl, "_blank"),
                                    },
                                });
                            },
                            onError: handleError,
                        }),
                }}
                pending={closeReview.isPending}
                error={errorMessage}
            />
        </div>
    );
}
