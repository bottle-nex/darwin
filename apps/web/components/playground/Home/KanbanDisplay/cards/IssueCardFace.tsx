"use client";
import { CalendarIcon, UnknownStatusIcon } from "@trydarwin/ui/icons";
import type { ReactNode } from "react";

import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import IssueFieldChip from "@/components/playground/Issue/IssueFieldChip";
import { DATE_ICON_COLOR, PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import IconWrapper from "@/components/ui/IconWrapper";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import type { BoardIssue, BoardTag } from "@/types/board";
import type { Assignee, Priority } from "@/types/kanban";

import IssueTags from "../IssueTags";

const MAX_AVATARS = 3;

export function shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function AssigneeStack({ assignees }: { assignees: Assignee[] }) {
    const shown = assignees.slice(0, MAX_AVATARS);
    const overflow = assignees.length - shown.length;
    const avatars = (
        <>
            {shown.map((assignee, index) => (
                <PlaygroundAvatar
                    key={assignee.id}
                    letter={assignee.name.charAt(0).toUpperCase()}
                    src={assignee.image}
                    tone={assignee.tone}
                    className={cn(index === 0 && shown.length > 1 && "-rotate-7")}
                />
            ))}
            {overflow > 0 && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-white/10 text-[11px] font-medium text-neutral-300 ring-1 ring-inset ring-white/15">
                    +{overflow}
                </span>
            )}
        </>
    );

    return <span className="flex shrink-0 items-center -space-x-1">{avatars}</span>;
}

export default function IssueCardFace({
    identifier,
    issueId,
    boardIssue,
    title,
    status,
    priority,
    tags = [],
    targetDate,
    createdAt,
    assignees,
    children,
}: {
    identifier: string;
    issueId?: string;
    boardIssue?: BoardIssue;
    title: string;
    status?: string;
    priority: Priority;
    tags?: BoardTag[];
    targetDate?: string | null;
    createdAt?: string;
    assignees: Assignee[];
    children?: ReactNode;
}) {
    const column = KanbanBoard.COLUMNS.find((c) => c.status === status);
    const StatusIcon = column?.icon ?? UnknownStatusIcon;
    const priorityOption = PRIORITY_OPTIONS.find((option) => option.value === priority);

    const priorityChip =
        priorityOption && priority !== "none" ? (
            <IconWrapper
                variant="outline"
                hoverGroup="card"
                icon={priorityOption.icon}
                iconClassName={cn("text-neutral-300", priorityOption.iconClassName)}
                className="size-6"
            />
        ) : null;

    const targetDateChip = targetDate ? (
        <IconWrapper
            variant="outline"
            hoverGroup="card"
            icon={CalendarIcon}
            iconClassName={DATE_ICON_COLOR.target}
            className="px-2.5 text-neutral-300"
        >
            {shortDate(targetDate)}
        </IconWrapper>
    ) : null;

    return (
        <>
            <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] tracking-[0.04em] text-neutral-500">
                    {identifier}
                </span>
                {issueId ? (
                    <IssueFieldChip issueId={issueId} issue={boardIssue} field="assignees">
                        <AssigneeStack assignees={assignees} />
                    </IssueFieldChip>
                ) : (
                    <AssigneeStack assignees={assignees} />
                )}
            </div>

            <div className="mt-2 flex items-start gap-1.5">
                {issueId ? (
                    <IssueFieldChip
                        issueId={issueId}
                        issue={boardIssue}
                        field="status"
                        className="mt-px shrink-0 cursor-pointer disabled:cursor-default"
                    >
                        <StatusIcon
                            className={cn("size-4.25", column?.titleBox ?? "text-neutral-500")}
                            aria-label={column?.title ?? "No status"}
                        />
                    </IssueFieldChip>
                ) : (
                    <StatusIcon
                        className={cn(
                            "mt-px size-4.25 shrink-0",
                            column?.titleBox ?? "text-neutral-500",
                        )}
                        aria-label={column?.title ?? "No status"}
                    />
                )}
                <p className="line-clamp-2 text-[14px] leading-snug font-medium text-neutral-50">
                    {title}
                </p>
            </div>

            {priorityChip || targetDate || tags.length ? (
                <div className="mt-2.5 flex items-center gap-1.5 overflow-hidden p-0.25">
                    {priorityChip && issueId ? (
                        <IssueFieldChip issueId={issueId} issue={boardIssue} field="priority">
                            {priorityChip}
                        </IssueFieldChip>
                    ) : (
                        priorityChip
                    )}
                    {tags.length > 0 && issueId ? (
                        <IssueFieldChip issueId={issueId} issue={boardIssue} field="tags">
                            <span className="flex flex-wrap items-center gap-1.5">
                                <IssueTags tags={tags} />
                            </span>
                        </IssueFieldChip>
                    ) : (
                        <IssueTags tags={tags} className="contents" />
                    )}
                    {targetDate &&
                        (issueId ? (
                            <IssueFieldChip issueId={issueId} issue={boardIssue} field="dates">
                                {targetDateChip}
                            </IssueFieldChip>
                        ) : (
                            targetDateChip
                        ))}
                </div>
            ) : null}

            {children}

            {createdAt && (
                <p className="mt-2.5 text-[11px] leading-none text-neutral-400">
                    Created {shortDate(createdAt)}
                </p>
            )}
        </>
    );
}
