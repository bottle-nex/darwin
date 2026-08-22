import { GoCheck, GoComment, GoFileDiff, GoXCircle } from "react-icons/go";
import Markdown from "@/components/utility/Markdown";
import type { ReviewComment } from "@trymatcha/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import ReviewActorAvatar from "../ReviewActorAvatar";

const REVIEW_VERDICT: Record<string, { icon: typeof GoCheck; label: string; tone: string }> = {
    approved: { icon: GoCheck, label: "approved these changes", tone: "text-green-400" },
    changes_requested: { icon: GoXCircle, label: "requested changes", tone: "text-rose-400" },
    commented: { icon: GoComment, label: "reviewed", tone: "text-neutral-500" },
};

export default function ReviewCommentCard({ comment }: { comment: ReviewComment }) {
    const verdict = comment.state ? REVIEW_VERDICT[comment.state] : null;
    const VerdictIcon = verdict?.icon;

    return (
        <article className="flex gap-3">
            <ReviewActorAvatar actor={comment.author} className="mt-0.5 size-6" />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-[14.5px]">
                    <a
                        href={comment.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-neutral-200 transition-colors hover:text-neutral-50"
                    >
                        {comment.author?.login ?? "Unknown"}
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
                            <GoFileDiff className="size-3 shrink-0" />
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

                <Markdown className="mt-2 text-[15px]">{comment.body}</Markdown>
            </div>
        </article>
    );
}
