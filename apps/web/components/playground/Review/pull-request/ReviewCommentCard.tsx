"use client";

import type { ReviewComment } from "@trydarwin/types";
import {
    CheckIcon,
    CopyIcon,
    DeleteIcon,
    EditIcon,
    OverflowMenuIcon,
    ReviewCommentFileIcon,
    ReviewVerdictApprovedIcon,
    ReviewVerdictCommentIcon,
    ReviewVerdictRejectedIcon,
} from "@trydarwin/ui/icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import Markdown from "@/components/utility/Markdown";
import { useGithubLink } from "@/hooks/github/useGithubLink";
import { useDeleteReviewComment } from "@/hooks/review/useDeleteReviewComment";
import { useUpdateReviewComment } from "@/hooks/review/useUpdateReviewComment";
import { formatRelativeTime } from "@/lib/format";
import { markdownToPlainText } from "@/lib/markdown";
import { cn } from "@/lib/utils";

import GithubActorName from "../GithubActorName";
import ReviewActorAvatar from "../ReviewActorAvatar";

const REVIEW_VERDICT: Record<
    string,
    { icon: typeof ReviewVerdictApprovedIcon; label: string; tone: string }
> = {
    approved: {
        icon: ReviewVerdictApprovedIcon,
        label: "approved these changes",
        tone: "text-green-400",
    },
    changes_requested: {
        icon: ReviewVerdictRejectedIcon,
        label: "requested changes",
        tone: "text-rose-400",
    },
    commented: { icon: ReviewVerdictCommentIcon, label: "reviewed", tone: "text-neutral-500" },
};

export default function ReviewCommentCard({
    comment,
    projectId,
    pullNumber,
}: {
    comment: ReviewComment;
    projectId: string | undefined;
    pullNumber: number;
}) {
    const verdict = comment.state ? REVIEW_VERDICT[comment.state] : null;
    const VerdictIcon = verdict?.icon;

    const { data: link } = useGithubLink();
    const isMine = Boolean(link?.githubLogin) && comment.author?.login === link?.githubLogin;
    const canDelete = isMine && comment.kind !== "review";

    const update = useUpdateReviewComment(projectId, pullNumber);
    const remove = useDeleteReviewComment(projectId, pullNumber);

    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(comment.body);
    const [confirmOpen, setConfirmOpen] = useState(false);

    function startEdit() {
        setDraft(comment.body);
        setIsEditing(true);
    }

    function cancelEdit() {
        setIsEditing(false);
        update.reset();
    }

    function saveEdit() {
        const body = draft.trim();
        if (!body || update.isPending) return;
        update.mutate({ commentId: comment.id, body }, { onSuccess: () => setIsEditing(false) });
    }

    function confirmDelete() {
        remove.mutate(comment.id, { onSuccess: () => setConfirmOpen(false) });
    }

    return (
        <article className="group/comment relative flex gap-3">
            <ReviewActorAvatar actor={comment.author} className="mt-0.5 size-6" />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-[14.5px]">
                    <a
                        href={comment.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-neutral-200 transition-colors hover:text-neutral-50"
                    >
                        <GithubActorName login={comment.author?.login} />
                    </a>
                    {verdict && VerdictIcon && (
                        <span className={cn("flex items-center gap-1", verdict.tone)}>
                            <VerdictIcon className="size-3.5" />
                            {verdict.label}
                        </span>
                    )}
                    <span className="text-neutral-600">
                        {formatRelativeTime(comment.createdAt)}
                    </span>
                </div>

                {comment.path && (
                    <div className="mt-1.5 overflow-hidden rounded-md border border-border">
                        <p className="flex items-center gap-1.5 bg-white/[0.02] px-2 py-1 font-mono text-[13.5px] text-neutral-500">
                            <ReviewCommentFileIcon className="size-3 shrink-0" />
                            <span className="truncate">
                                {comment.path}
                                {comment.line ? `:${comment.line}` : ""}
                            </span>
                        </p>
                        {comment.diffHunk && (
                            <pre className="overflow-x-auto px-2 py-1.5 font-mono text-[13px] leading-relaxed text-neutral-500">
                                {comment.diffHunk}
                            </pre>
                        )}
                    </div>
                )}

                {isEditing ? (
                    <div className="mt-2 flex flex-col gap-2">
                        <Textarea
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            className="min-h-24 text-[15px]"
                        />
                        {update.isError && (
                            <p className="text-[13px] text-rose-400">
                                That comment didn&apos;t save. Try again.
                            </p>
                        )}
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                size="xs"
                                variant="ghost"
                                className="rounded-sm font-medium text-snow"
                                disabled={update.isPending}
                                onClick={cancelEdit}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="xs"
                                variant="default"
                                className="gap-x-1.5 rounded-sm bg-green-700 font-medium text-snow"
                                loading={update.isPending}
                                disabled={!draft.trim()}
                                onClick={saveEdit}
                            >
                                <CheckIcon />
                                Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Markdown className="mt-2 text-[15px]">{comment.body}</Markdown>
                )}
            </div>

            {!isEditing && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label="Comment options"
                            className="absolute top-0 right-0 flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-100 focus-visible:opacity-100 group-hover/comment:opacity-100 data-[state=open]:opacity-100"
                        >
                            <OverflowMenuIcon className="size-4" aria-hidden />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                            onSelect={() =>
                                navigator.clipboard.writeText(markdownToPlainText(comment.body))
                            }
                        >
                            <CopyIcon className="size-3.5" aria-hidden />
                            <span className="flex-1">Copy</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => navigator.clipboard.writeText(comment.body)}
                        >
                            <CopyIcon className="size-3.5" aria-hidden />
                            <span className="flex-1">Copy Markdown</span>
                        </DropdownMenuItem>
                        {isMine && (
                            <DropdownMenuItem onSelect={startEdit}>
                                <EditIcon className="size-3.5" aria-hidden />
                                <span className="flex-1">Edit</span>
                            </DropdownMenuItem>
                        )}
                        {canDelete && (
                            <DropdownMenuItem
                                onSelect={() => setConfirmOpen(true)}
                                variant="destructive"
                            >
                                <DeleteIcon className="size-3.5" aria-hidden />
                                <span className="flex-1">Delete</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {canDelete && (
                <ConfirmDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    title="Delete comment?"
                    description="This removes the comment from the pull request on GitHub. You can't undo this."
                    cancel={{
                        label: "Cancel",
                        variant: "tertiary",
                        onClick: () => setConfirmOpen(false),
                    }}
                    confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
                    pending={remove.isPending}
                    error={remove.isError ? "That comment didn't delete. Try again." : undefined}
                />
            )}
        </article>
    );
}
