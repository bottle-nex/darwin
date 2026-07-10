import type { ReactNode } from "react";
import { MdChat } from "react-icons/md";
import { cn } from "@/lib/utils";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import type { Issue } from "../types";
import { PRIORITY_DOT } from "../data";
import { CARD_SHELL } from "../cardStyles";
import IssueTags from "../IssueTags";

type BaseCardProps = {
    issue: Issue;
    /** Status-specific content rendered between the title and the footer. */
    children?: ReactNode;
    className?: string;
};

/**
 * Reusable, presentational card shell shared by every column — priority + label
 * + number header, title, a `children` slot for status-specific details, and a
 * footer with comment count, project, and assignee avatars. Drag behaviour lives
 * in `SortableIssue`, which wraps this; the same shell is reused in the drag
 * overlay so the lifted card looks identical to the resting one.
 */
export default function BaseCard({ issue, children, className }: BaseCardProps) {
    const issue_assignees_length = issue.assignees.length;
    return (
        <div className={cn(CARD_SHELL, className)}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span
                        className={cn("size-1.5 rounded-full", PRIORITY_DOT[issue.priority])}
                        aria-hidden
                    />
                    <IssueTags tags={issue.tags} />
                </div>
                <span className="font-mono text-[11px] text-neutral-500">{issue.number}</span>
            </div>

            <p className="mt-2 text-[13px] font-medium leading-snug text-neutral-100">
                {issue.title}
            </p>

            {children}

            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
                <div className="flex min-w-0 items-center gap-2 text-[11px] text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                        <MdChat className="size-3" aria-hidden />
                        {issue.comments}
                    </span>
                    <span className="truncate text-neutral-600">{issue.project}</span>
                </div>
                <div className="flex shrink-0 items-center -space-x-1">
                    {issue.assignees.map((a, index) => (
                        <PlaygroundAvatar
                            key={a.id}
                            letter={a.name.charAt(0).toUpperCase()}
                            src={a.image}
                            tone={a.tone}
                            className={cn(index === 0 && issue_assignees_length > 1 && "-rotate-7")}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
