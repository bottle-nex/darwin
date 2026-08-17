import type { ReactNode } from "react";
import { LuCircleDashed } from "react-icons/lu";
import { HiCalendar } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import type { Assignee, Priority } from "@/types/kanban";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { DATE_ICON_COLOR, PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";

const CHIP =
    "inline-flex h-6 items-center gap-1.5 rounded-full border border-white/10 px-2 text-[11px] leading-none text-neutral-300";

const MAX_AVATARS = 3;

export function shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function issueIdentifier(projectName: string | undefined, number: number | string): string {
    const key = (projectName ?? "ISS").slice(0, 3).toUpperCase();
    return `${key}-${String(number).replace(/^#/, "")}`;
}

function AssigneeStack({ assignees, onClick }: { assignees: Assignee[]; onClick?: () => void }) {
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
                <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-white/10 text-[11px] font-medium text-neutral-300 ring-1 ring-inset ring-white/15">
                    +{overflow}
                </span>
            )}
        </>
    );

    if (!onClick) return <span className="flex shrink-0 items-center -space-x-1">{avatars}</span>;

    return (
        <button
            type="button"
            aria-label="Assignees"
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClick();
            }}
            className="flex shrink-0 cursor-pointer items-center -space-x-1"
        >
            {avatars}
        </button>
    );
}

export default function IssueCardFace({
    identifier,
    title,
    status,
    priority,
    targetDate,
    createdAt,
    assignees,
    onAssigneesClick,
    children,
}: {
    identifier: string;
    title: string;
    status?: string;
    priority: Priority;
    targetDate?: string | null;
    createdAt?: string;
    assignees: Assignee[];
    onAssigneesClick?: () => void;
    children?: ReactNode;
}) {
    const column = KanbanBoard.COLUMNS.find((c) => c.status === status);
    const StatusIcon = column?.icon ?? LuCircleDashed;
    const priorityOption = PRIORITY_OPTIONS.find((option) => option.value === priority);

    return (
        <>
            <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] tracking-[0.04em] text-neutral-500">
                    {identifier}
                </span>
                <AssigneeStack assignees={assignees} onClick={onAssigneesClick} />
            </div>

            <div className="mt-2 flex items-start gap-1.5">
                <StatusIcon
                    className={cn("mt-px size-4 shrink-0", column?.titleBox ?? "text-neutral-500")}
                    aria-label={column?.title ?? "No status"}
                />
                <p className="line-clamp-2 text-[13px] leading-snug font-medium text-neutral-50">
                    {title}
                </p>
            </div>

            {(priorityOption && priority !== "none") || targetDate ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {priorityOption && priority !== "none" && (
                        <span className={cn(CHIP, "px-1.5")} title={priorityOption.label}>
                            <priorityOption.icon
                                className={cn(
                                    "size-3.5 text-neutral-300",
                                    priorityOption.iconClassName,
                                )}
                                aria-hidden
                            />
                        </span>
                    )}
                    {targetDate && (
                        <span className={CHIP}>
                            <HiCalendar
                                className={cn("size-3.5", DATE_ICON_COLOR.target)}
                                aria-hidden
                            />
                            {shortDate(targetDate)}
                        </span>
                    )}
                </div>
            ) : null}

            {children}

            {createdAt && (
                <p className="mt-2.5 text-[12px] leading-none text-neutral-400">
                    Created {shortDate(createdAt)}
                </p>
            )}
        </>
    );
}
