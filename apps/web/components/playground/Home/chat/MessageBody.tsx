"use client";

import {
    parse_reference_token,
    reference_key,
    reference_issues,
    reference_labels,
    reference_split_pattern,
    type LabelledReference,
} from "@trymatcha/types";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";

const TOMBSTONE_LABEL = { member: "@unknown", issue: "#deleted issue" } as const;

const STATUS_STYLE = new Map(
    KanbanBoard.COLUMNS.map((column) => [column.status as string, column]),
);

export default function MessageBody({
    text,
    references,
    isMine,
}: {
    text: string;
    references: LabelledReference[];
    isMine: boolean;
}) {
    const { openEdit } = useIssueDialog();
    const labels = reference_labels(references);
    const issues = reference_issues(references);
    return (
        <>
            {text.split(reference_split_pattern()).map((part, index) => {
                if (index % 2 === 0) return part;

                const token = parse_reference_token(part);
                if (!token) return part;

                const label = labels.get(reference_key(token.kind, token.id));
                if (!label) {
                    return (
                        <span
                            key={index}
                            className={cn(
                                "mx-px rounded-[3px] px-1 italic",
                                isMine ? "text-white/60" : "text-neutral-500",
                            )}
                        >
                            {TOMBSTONE_LABEL[token.kind]}
                        </span>
                    );
                }

                if (token.kind === "member") {
                    return (
                        <span key={index} className="mx-px px-1 font-semibold text-white">
                            {label}
                        </span>
                    );
                }

                const issue = issues.get(token.id);
                const status = issue?.status ? STATUS_STYLE.get(issue.status) : undefined;
                const StatusIcon = status?.icon;
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => openEdit(token.id)}
                        className={cn(
                            "mx-px inline-flex cursor-pointer items-center gap-1 rounded-[4px] px-1 align-middle font-mono text-[12px] font-medium transition-colors",
                            isMine
                                ? "bg-black/20 text-white hover:bg-black/30"
                                : "bg-white/10 text-neutral-100 hover:bg-white/15",
                        )}
                    >
                        {StatusIcon && (
                            <StatusIcon className={cn("size-3", status.titleBox)} aria-hidden />
                        )}
                        {issue ? `#${issue.number}` : label}
                    </button>
                );
            })}
        </>
    );
}
