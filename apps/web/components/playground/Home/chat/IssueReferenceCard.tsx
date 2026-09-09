"use client";

import type { ReferencedIssueLabel } from "@trydarwin/types";
import { UnknownStatusIcon } from "@trydarwin/ui/icons";

import { Button } from "@/components/ui/button";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

const STATUS_STYLE = new Map(
    KanbanBoard.COLUMNS.map((column) => [column.status as string, column]),
);

export default function IssueReferenceCard({ issue }: { issue: ReferencedIssueLabel }) {
    const identifier = useIssueIdentifier();
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const status = issue.status ? STATUS_STYLE.get(issue.status) : undefined;
    const StatusIcon = status?.icon ?? UnknownStatusIcon;

    return (
        <Button
            variant="unstyled"
            type="button"
            onClick={() => issue.id && openIssue(issue.id)}
            className={cn(
                "surface-card relative flex h-21 w-full max-w-52 cursor-pointer items-stretch rounded-[7px] p-1 text-left",
            )}
        >
            <div className="h-3.5 w-3.5 bg-charcoal rounded-full absolute top-1/2 -translate-y-1/2 -left-1.5 border-r border-border" />
            <span className="flex w-9 shrink-0 items-start justify-center" aria-hidden>
                <span className="flex size-6 items-center justify-center rounded-full">
                    <StatusIcon
                        className={cn("size-4.5", status?.titleBox ?? "text-neutral-500")}
                    />
                </span>
            </span>
            <span className="surface-sunken flex min-w-0 flex-1 flex-col items-start justify-between gap-0.5 rounded-[5px] px-2 py-1.5 backdrop-blur-xs">
                <span className="shrink-0 text-[11.5px] leading-3.5 text-neutral-500">
                    {identifier(issue.number)}
                    {status && ` · ${status.title}`}
                </span>
                <div className="w-full min-w-0 overflow-hidden">
                    <span className="block truncate text-[14px] leading-4.5 font-medium text-neutral-100">
                        {issue.title}
                    </span>
                    {issue.description && (
                        <span
                            className="line-clamp-1 text-[10.5px] leading-3.5 font-medium text-foreground/60 [&_a]:underline [&_em]:italic [&_p]:m-0 [&_p]:inline [&_strong]:font-semibold [&_strong]:text-neutral-200"
                            dangerouslySetInnerHTML={{ __html: issue.description }}
                        />
                    )}
                </div>
            </span>
        </Button>
    );
}
