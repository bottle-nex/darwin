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
            className="flex w-full max-w-60 cursor-pointer items-stretch rounded-[14px] border border-graphite/50 bg-cement p-1 text-left"
        >
            <span className="flex w-11 shrink-0 items-start justify-center" aria-hidden>
                <span className="flex size-7 items-center justify-center rounded-full bg-white/6">
                    <StatusIcon className={cn("size-4", status?.titleBox ?? "text-neutral-500")} />
                </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-lg bg-charcoal px-2.5 py-2">
                <span className="line-clamp-2 text-[11.5px] leading-4 font-medium text-neutral-100">
                    {issue.title}
                </span>
                <span className="text-[10px] leading-4 text-neutral-500">
                    #{issue.number}
                    {status && ` · ${status.title}`}
                </span>
            </span>
        </Button>
    );
}
