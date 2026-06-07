import type { ReactNode } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import type { Issue } from "../types";
import { PRIORITY_DOT } from "../data";

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
    return (
        <div
            className={cn(
                "rounded-lg border border-white/6 bg-neutral-800/70 p-3 text-left shadow-sm ring-1 ring-black/20 transition-colors hover:border-white/12",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span
                        className={cn("size-1.5 rounded-full", PRIORITY_DOT[issue.priority])}
                        aria-hidden
                    />
                    {issue.label && (
                        <span
                            className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                                issue.label.className,
                            )}
                        >
                            {issue.label.name}
                        </span>
                    )}
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
                        <MessageSquare className="size-3" aria-hidden />
                        {issue.comments}
                    </span>
                    <span className="truncate text-neutral-600">{issue.project}</span>
                </div>
                <div className="flex shrink-0 items-center -space-x-1">
                    {issue.assignees.map((a) => (
                        <PlaygroundAvatar
                            key={a.id}
                            letter={a.name.charAt(0).toUpperCase()}
                            tone={a.tone}
                            size="sm"
                            className="ring-1 ring-neutral-800"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
