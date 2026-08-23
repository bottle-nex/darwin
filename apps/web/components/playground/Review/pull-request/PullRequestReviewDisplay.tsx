"use client";
import type { ReviewHeader } from "@trymatcha/types";
import Markdown from "@/components/utility/Markdown";
import LogoLoader from "@/components/app/LogoLoader";
import { useReviewComments } from "@/hooks/review/useReviewComments";
import ReviewActorAvatar from "../ReviewActorAvatar";
import ReviewCommentCard from "./ReviewCommentCard";
import ReviewComposer from "./ReviewComposer";
import ReviewMergePanel from "./ReviewMergePanel";
import ReviewSummary from "./ReviewSummary";

export default function PullRequestReviewDisplay({
    projectId,
    review,
}: {
    projectId: string | undefined;
    review: ReviewHeader;
}) {
    const { data: comments, isPending } = useReviewComments(projectId, review.pullNumber);

    return (
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6" data-lenis-prevent>
            <div className="flex flex-col gap-7">
                <ReviewSummary review={review} />

                {review.body?.trim() && (
                    <section className="flex gap-3 border-t border-border pt-6">
                        <ReviewActorAvatar actor={review.author} className="mt-0.5 size-6" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[14.5px] font-medium text-neutral-200">
                                {review.author?.login ?? "Unknown"}
                                <span className="ml-2 font-normal text-neutral-600">
                                    opened this pull request
                                </span>
                            </p>
                            <Markdown className="mt-2 text-[15px]">{review.body}</Markdown>
                        </div>
                    </section>
                )}

                <section className="flex flex-col gap-6 border-t border-border pt-6">
                    {isPending ? (
                        <LogoLoader className="h-24 w-full text-snow" />
                    ) : comments?.length ? (
                        comments.map((comment) => (
                            <ReviewCommentCard key={comment.id} comment={comment} />
                        ))
                    ) : (
                        <></>
                    )}
                </section>
                <ReviewMergePanel review={review} projectId={projectId} />
                <ReviewComposer projectId={projectId} review={review} />
            </div>
        </div>
    );
}
