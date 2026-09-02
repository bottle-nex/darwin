"use client";
import type { ReviewHeader } from "@trymatcha/types";
import type { IconType } from "@trymatcha/ui/icons";
import {
    BranchMergeDirectionIcon,
    ChangedFilesIcon,
    CommentCountIcon,
    CommitsIcon,
} from "@trymatcha/ui/icons";
import type { ReactNode } from "react";

import { formatRelativeTime } from "@/lib/format";
import { PULL_REQUEST_STATE } from "@/lib/review/pullRequestState";
import { cn } from "@/lib/utils";

import GithubActorName from "../GithubActorName";
import ReviewActorAvatar from "../ReviewActorAvatar";

const TITLE = "text-[20px] leading-[1.3] font-medium tracking-[-0.011em] text-neutral-100";
const META = "text-[12.5px] leading-none text-neutral-400";
const MONO = "font-mono text-[11.5px] leading-none tracking-tight text-neutral-500";
const QUIET = "text-neutral-500";

export default function ReviewSummary({ review }: { review: ReviewHeader }) {
    const state = PULL_REQUEST_STATE[review.state];
    const StateIcon = state.icon;
    const hasSidecar = review.labels.length > 0 || review.reviewers.length > 0;

    return (
        <div className="flex flex-col gap-3.5">
            <h1 className={TITLE}>{review.title}</h1>

            <MetaRow>
                <span
                    className={cn(
                        "flex items-center gap-1.5 rounded-full px-2 py-1 text-[11.5px] font-medium",
                        state.surface,
                        state.text,
                    )}
                >
                    <StateIcon className="size-3.5" />
                    {review.draft ? "Draft" : state.label}
                </span>

                {review.author && (
                    <>
                        <span className="flex items-center gap-1.5 text-neutral-300">
                            <ReviewActorAvatar actor={review.author} className="size-4" />
                            <GithubActorName login={review.author.login} />
                        </span>
                        <Dot />
                    </>
                )}

                <span className={MONO}>
                    {review.repo}#{review.pullNumber}
                </span>
                <Dot />
                <span
                    className={cn(
                        MONO,
                        "flex min-w-0 items-center gap-0.5 rounded-full px-2 py-1.5 ring-[0.5px] ring-snow/5",
                    )}
                >
                    <span className="truncate">{review.baseBranch}</span>
                    <BranchMergeDirectionIcon
                        className="size-3.5 shrink-0 text-neutral-600"
                        aria-hidden
                    />
                    <span className="truncate">{review.headBranch}</span>
                </span>
                <Dot />
                <span className={QUIET}>opened {formatRelativeTime(review.createdAt)}</span>
            </MetaRow>

            <MetaRow className="gap-x-4">
                <Stat icon={ChangedFilesIcon}>
                    <span className="tabular-nums">{review.changedFiles}</span>
                    <span className={QUIET}>{review.changedFiles === 1 ? "file" : "files"}</span>
                    <span className="tabular-nums">
                        <span className="text-green-500">+{review.additions}</span>{" "}
                        <span className="text-rose-500">−{review.deletions}</span>
                    </span>
                </Stat>
                <Stat icon={CommitsIcon}>
                    <span className="tabular-nums">{review.commits}</span>
                    <span className={QUIET}>{review.commits === 1 ? "commit" : "commits"}</span>
                </Stat>
                <Stat icon={CommentCountIcon}>
                    <span className="tabular-nums">{review.comments}</span>
                    <span className={QUIET}>{review.comments === 1 ? "comment" : "comments"}</span>
                </Stat>
            </MetaRow>

            {hasSidecar && (
                <MetaRow className="gap-x-4">
                    {review.labels.map((label) => (
                        <span
                            key={label.name}
                            className="rounded-full px-2 py-1 text-[11.5px] font-medium"
                            style={{
                                color: `#${label.color}`,
                                backgroundColor: `#${label.color}1f`,
                            }}
                        >
                            {label.name}
                        </span>
                    ))}
                    {review.reviewers.length > 0 && (
                        <span className="flex items-center gap-1.5">
                            <span className={QUIET}>Reviewers</span>
                            {review.reviewers.map((reviewer) => (
                                <ReviewActorAvatar
                                    key={reviewer.login}
                                    actor={reviewer}
                                    className="size-4"
                                />
                            ))}
                        </span>
                    )}
                </MetaRow>
            )}
        </div>
    );
}

function MetaRow({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-2.5", META, className)}>
            {children}
        </div>
    );
}

function Stat({ icon: Icon, children }: { icon: IconType; children: ReactNode }) {
    return (
        <span className="flex items-center gap-1.5">
            <Icon className="size-3.5 shrink-0 text-neutral-600" />
            {children}
        </span>
    );
}

function Dot() {
    return <span className="text-neutral-700">·</span>;
}
