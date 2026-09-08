"use client";

import {
    as_icon_pick,
    type LabelledReference,
    parse_reference_token,
    reference_issues,
    reference_key,
    reference_labels,
    reference_split_pattern,
    reference_teams,
} from "@trydarwin/types";
import { TeamEntityIcon } from "@trydarwin/ui/icons";

import { IconPickGlyph } from "@/components/ui/IconPicker";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { urlSplitPattern, withProtocol } from "@/lib/urls";
import { cn } from "@/lib/utils";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

const TOMBSTONE_LABEL = {
    member: "@unknown",
    issue: "#deleted issue",
    team: "@deleted team",
} as const;

function LinkedText({ text, isMine }: { text: string; isMine: boolean }) {
    return (
        <>
            {text.split(urlSplitPattern()).map((part, index) =>
                index % 2 === 0 ? (
                    part
                ) : (
                    <a
                        key={index}
                        href={withProtocol(part)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "underline decoration-current/40 underline-offset-2 transition-colors hover:decoration-current",
                            isMine ? "text-snow" : "text-primary",
                        )}
                    >
                        {part}
                    </a>
                ),
            )}
        </>
    );
}

export default function MessageBody({
    text,
    references,
    isMine,
}: {
    text: string;
    references: LabelledReference[];
    isMine: boolean;
}) {
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const identifier = useIssueIdentifier();
    const labels = reference_labels(references);
    const issues = reference_issues(references);
    const teams = reference_teams(references);
    return (
        <>
            {text.split(reference_split_pattern()).map((part, index) => {
                if (index % 2 === 0) return <LinkedText key={index} text={part} isMine={isMine} />;

                const token = parse_reference_token(part);
                if (!token) return <LinkedText key={index} text={part} isMine={isMine} />;

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

                if (token.kind === "team") {
                    const icon = as_icon_pick(teams.get(token.id)?.icon);
                    return (
                        <span
                            key={index}
                            className="mx-px inline-flex items-center gap-1 px-1 align-middle font-semibold text-white"
                        >
                            {icon ? (
                                <IconPickGlyph pick={icon} className="size-3 text-[11px]" />
                            ) : (
                                <TeamEntityIcon className="size-3" aria-hidden />
                            )}
                            {label}
                        </span>
                    );
                }

                const issue = issues.get(token.id);
                const status = KanbanBoard.columnFor(issue?.status);
                const StatusIcon = status?.icon;
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => openIssue(token.id)}
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
                        {issue ? identifier(issue.number) : label}
                    </button>
                );
            })}
        </>
    );
}
