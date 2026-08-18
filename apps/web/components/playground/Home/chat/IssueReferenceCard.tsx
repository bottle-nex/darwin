"use client";

import { LuCircleDashed } from "react-icons/lu";
import type { ReferencedIssueLabel } from "@trymatcha/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { useIssueRoute } from "@/components/playground/Issue/useIssueRoute";

const STATUS_STYLE = new Map(
    KanbanBoard.COLUMNS.map((column) => [column.status as string, column]),
);

export default function IssueReferenceCard({ issue }: { issue: ReferencedIssueLabel }) {
    const { openIssue } = useIssueRoute();
    const status = issue.status ? STATUS_STYLE.get(issue.status) : undefined;
    const StatusIcon = status?.icon ?? LuCircleDashed;

    return (
        <Button
            variant="unstyled"
            type="button"
            onClick={() => issue.id && openIssue(issue.id)}
            className={cn(
                "flex w-60 h-25 cursor-pointer items-stretch rounded-[8px] border border-graphite/50 p-1 text-left relative",
                status?.cardTint ?? "bg-cement",
            )}
        >
            <div className="h-4.5 w-4.5 bg-charcoal rounded-full absolute top-1/2 -translate-y-1/2 -left-2 border-r border-graphite" />
            <span className="flex w-12 shrink-0 items-start justify-center" aria-hidden>
                <span className="flex size-8 items-center justify-center rounded-full">
                    <StatusIcon className={cn("size-6", status?.titleBox ?? "text-neutral-500")} />
                </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.75 rounded-[6px] bg-charcoal/70 px-2.5 py-2 backdrop-blur-xs">
                <span className="line-clamp-2 text-[12px] leading-4 font-medium text-neutral-100">
                    {issue.title}
                </span>
                {issue.description && (
                    <span
                        className="line-clamp-2 text-[11.5px] leading-4 font-medium text-foreground/60 [&_a]:underline [&_em]:italic [&_p]:m-0 [&_p]:inline [&_strong]:font-semibold [&_strong]:text-neutral-200"
                        dangerouslySetInnerHTML={{ __html: issue.description }}
                    />
                )}
                <span className="line-clamp-2 text-[11.5px] leading-4 font-medium text-neutral-100"></span>
                <span className="text-[10px] leading-4 text-neutral-500">
                    #{issue.number}
                    {status && ` · ${status.title}`}
                </span>
            </span>
        </Button>
    );
}
